'use server';

import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { calculateRentalPrice } from '@/lib/utils/booking';

const client = new OpenAI({
    baseURL: 'https://ai.megallm.io/v1',
    apiKey: process.env.MEGALLM_API_KEY,
});

const SYSTEM_PROMPT = `Bạn là assistant chuyên trích xuất thông tin đặt lịch thuê máy ảnh từ tin nhắn xác nhận.
Hãy phân tích tin nhắn và trả về JSON với các trường sau:
- cameraName: Tên máy ảnh (ví dụ: "Canon M10", "Sony A6400")
- customerPhone: Số điện thoại khách hàng (chỉ số, ví dụ: "0333867762")
- pickupDate: Ngày nhận máy (format: "YYYY-MM-DD", năm mặc định là 2026 nếu không có)
- pickupHour: Giờ nhận máy (0-23)
- pickupMinute: Phút nhận máy (0-59)
- returnDate: Ngày trả máy (format: "YYYY-MM-DD", năm mặc định là 2026 nếu không có)
- returnHour: Giờ trả máy (0-23)
- returnMinute: Phút trả máy (0-59)
- totalFee: Tổng phí thuê (số nguyên, đơn vị nghìn đồng -> nhân 1000. Ví dụ: "120" -> 120000)
- depositAmount: Tiền đã cọc (số nguyên, đơn vị nghìn đồng -> nhân 1000. Ví dụ: "50" -> 50000)
- customerName: Tên khách hàng (mặc định "Khách chatbot" nếu không rõ)
- platforms: Mảng các nền tảng liên hệ (ví dụ: ["TikTok"], ["Facebook", "Zalo"]. Mặc định ["Khác"])

Chỉ trả về JSON, không giải thích thêm. Nếu không tìm thấy thông tin nào, để giá trị là null.`;

/**
 * Fast-path parsing using Regex for the standard Kantra template
 */
function tryFastParse(message: string) {
    try {
        const pickupMatch = message.match(/Thời gian nhận:?\s*(\d{1,2}:\d{2}),\s*(\d{1,2}\/\d{1,2})/i);
        const returnMatch = message.match(/Thời gian trả:?\s*(\d{1,2}:\d{2}),\s*(\d{1,2}\/\d{1,2})/i);
        const cameraMatch = message.match(/Máy:?\s*([^\n\r]+)/i);
        const phoneMatch = message.match(/(?:SĐT|SDT):?\s*(\d+)/i);
        const depositMatch = message.match(/Đã cọc:?\s*([\d.]+)/i);
        const feeMatch = message.match(/Tổng phí thuê:?\s*([\d.]+)/i);
        const nameMatch = message.match(/Tên Khách:?\s*([^\n\r]+)/i);
        const platformMatch = message.match(/Nền tảng:?\s*([^\n\r]+)/i);

        if (!pickupMatch || !returnMatch || !cameraMatch || !phoneMatch) return null;

        const formatDate = (dateStr: string) => {
            const [day, month] = dateStr.split('/').map(s => s.padStart(2, '0'));
            return `2026-${month}-${day}`;
        };

        const [pickupHour, pickupMinute] = pickupMatch[1].split(':').map(Number);
        const [returnHour, returnMinute] = returnMatch[1].split(':').map(Number);
        const parseAmount = (str: string) => parseInt(str.replace(/\./g, '')) || 0;

        return {
            cameraName: cameraMatch[1].trim(),
            customerPhone: phoneMatch[1].trim(),
            pickupDate: formatDate(pickupMatch[2]),
            pickupHour,
            pickupMinute,
            returnDate: formatDate(returnMatch[2]),
            returnHour,
            returnMinute,
            depositAmount: depositMatch ? parseAmount(depositMatch[1]) : 0,
            totalFee: feeMatch ? parseAmount(feeMatch[1]) : 0,
            customerName: nameMatch ? nameMatch[1].trim() : 'Khách chatbot',
            platforms: platformMatch ? [platformMatch[1].trim()] : ['Khác']
        };
    } catch (e) {
        return null;
    }
}

interface ParsedResult {
    cameraName?: string;
    customerPhone?: string;
    pickupDate?: string;
    pickupHour?: number;
    pickupMinute?: number;
    returnDate?: string;
    returnHour?: number;
    returnMinute?: number;
    depositAmount?: number;
    totalFee?: number;
    customerName?: string;
    platforms?: string[];
}

export async function POST(request: Request) {
    try {
        const { message, action } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // --- Fast Path: Try Regex Parsing first ---
        let parsed: ParsedResult | null = tryFastParse(message);
        let isFastPath = !!parsed;

        if (!parsed) {
            if (!process.env.MEGALLM_API_KEY) {
                return NextResponse.json(
                    { error: 'MEGALLM_API_KEY is not configured' },
                    { status: 500 }
                );
            }

            // Step 1: Parse the message via AI
            const response = await client.chat.completions.create({
                model: 'openai-gpt-oss-20b',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message },
                ],
                temperature: 0.1,
            });

            const content = response.choices[0]?.message?.content || '{}';

            // Try to parse the JSON response
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
            } catch {
                parsed = {};
            }
        }

        if (!parsed) {
            return NextResponse.json({ error: 'Lỗi parse tin nhắn' }, { status: 500 });
        }

        // If action is 'parse_only', just return parsed data
        if (action === 'parse_only') {
            return NextResponse.json({ data: parsed, isFastPath });
        }

        // Step 2: Build pickup and return times
        if (!parsed.pickupDate || !parsed.returnDate || parsed.pickupHour === null || parsed.returnHour === null) {
            return NextResponse.json({
                data: parsed,
                error: 'Không thể xác định thời gian nhận/trả máy',
            });
        }

        const pickupTime = new Date(parsed.pickupDate);
        pickupTime.setHours(parsed.pickupHour ?? 0, parsed.pickupMinute ?? 0, 0, 0);

        const returnTime = new Date(parsed.returnDate);
        returnTime.setHours(parsed.returnHour ?? 0, parsed.returnMinute ?? 0, 0, 0);

        // Step 3: Check camera availability
        const availabilityResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cameras/available`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pickupTime: pickupTime.toISOString(),
                returnTime: returnTime.toISOString(),
            }),
        });

        const availabilityData = await availabilityResponse.json();
        const availableCameras = availabilityData.data || [];

        // Find the camera by name (partial match)
        const cameraName = parsed.cameraName?.toLowerCase() || '';
        const simpleMatched = availableCameras.find((c: any) =>
            c.name?.toLowerCase().includes(cameraName) ||
            cameraName.includes(c.name?.toLowerCase())
        );

        if (!simpleMatched) {
            return NextResponse.json({
                data: parsed,
                available: false,
                error: `Không tìm thấy hoặc máy "${parsed.cameraName}" không còn trống trong khung giờ này`,
            });
        }

        // Fetch full camera details to get all price rates
        const cameraResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cameras`);
        const camerasData = await cameraResponse.json();
        const fullCamera = camerasData.data?.find((c: any) => c.id === (simpleMatched.id || simpleMatched.camera_id));

        if (!fullCamera) {
            return NextResponse.json({
                data: parsed,
                available: false,
                error: `Lỗi khi lấy thông tin chi tiết máy "${parsed.cameraName}"`,
            });
        }

        // Step 4: Calculate price from DB rates
        const priceBreakdown = calculateRentalPrice(fullCamera, pickupTime, returnTime);
        const calculatedFee = priceBreakdown.total;

        // Step 5: Find or create customer by phone
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        let customerId: string | null = null;

        if (parsed.customerPhone) {
            // Search for existing customer
            const customerSearchResponse = await fetch(`${baseUrl}/api/customers?phone=${parsed.customerPhone}`);
            const customerSearchData = await customerSearchResponse.json();

            if (customerSearchData.data && customerSearchData.data.length > 0) {
                customerId = customerSearchData.data[0].id;
            } else {
                // Create new customer
                const createCustomerResponse = await fetch(`${baseUrl}/api/customers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: parsed.customerName || 'Khách chatbot',
                        phone: parsed.customerPhone,
                        platforms: parsed.platforms || ['Khác'],
                    }),
                });
                const createCustomerData = await createCustomerResponse.json();
                if (createCustomerData.data?.id) {
                    customerId = createCustomerData.data.id;
                }
            }
        }

        if (!customerId) {
            return NextResponse.json({
                data: parsed,
                available: true,
                camera: fullCamera,
                error: `Không thể xác định khách hàng từ SĐT: ${parsed.customerPhone || 'Không có SĐT'}`,
            });
        }

        // Step 6: Get an employee to assign as creator
        const employeeResponse = await fetch(`${baseUrl}/api/employees`);
        const employeeData = await employeeResponse.json();
        const activeStaff = employeeData.data?.[0]?.id;

        // Step 7: Create booking automatically
        const bookingData = {
            customer_id: customerId,
            created_by: activeStaff || null,
            pickup_time: pickupTime.toISOString(),
            return_time: returnTime.toISOString(),
            booking_items: [{
                camera_id: fullCamera.id,
                quantity: 1,
                unit_price: calculatedFee,
                subtotal: calculatedFee,
            }],
            tasks: [
                {
                    type: 'pickup',
                    due_at: pickupTime.toISOString(),
                },
                {
                    type: 'return',
                    due_at: returnTime.toISOString(),
                },
            ],
            payment_status: (parsed.depositAmount ?? 0) > 0 ? 'deposited' : 'pending',
            deposit_type: (parsed.depositAmount ?? 0) > 0 ? 'custom' : 'none',
            deposit_amount: parsed.depositAmount ?? 0,
            total_rental_fee: calculatedFee,
            final_fee: calculatedFee,
            total_delivery_fee: 0,
            notes: `Tạo tự động từ Chatbot. Tin nhắn gốc:\n${message}`,
        };

        const createResponse = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok) {
            return NextResponse.json({
                data: parsed,
                available: true,
                camera: fullCamera,
                error: createResult.error || 'Lỗi khi tạo booking',
                debug: { customerId, activeStaff, bookingData }
            });
        }

        return NextResponse.json({
            data: parsed,
            available: true,
            camera: fullCamera,
            booking: createResult.data,
            success: true,
            isFastPath,
        });

    } catch (error) {
        console.error('Error in chatbot:', error);
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi xử lý' },
            { status: 500 }
        );
    }
}
