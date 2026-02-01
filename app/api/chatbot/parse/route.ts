'use server';

import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { calculateRentalPrice } from '@/lib/utils/booking';
import { createClient } from '@/lib/supabase/server';

const client = new OpenAI({
    baseURL: 'https://ai.megallm.io/v1',
    apiKey: process.env.MEGALLM_API_KEY,
});

const SYSTEM_PROMPT = `Bạn là assistant chuyên trích xuất thông tin đặt lịch thuê máy ảnh từ tin nhắn xác nhận.
Hãy phân tích tin nhắn và trả về JSON với các trường sau:
- cameraName: Tên máy ảnh / Thiết bị (ví dụ: "Canon M10", "Sony A6400")
- customerPhone: Số điện thoại khách hàng (chỉ số, ví dụ: "0333867762")
- pickupDate: Ngày nhận máy (format: "YYYY-MM-DD", năm mặc định là 2026 nếu không có)
- pickupHour: Giờ nhận máy (0-23)
- pickupMinute: Phút nhận máy (0-59)
- returnDate: Ngày trả máy (format: "YYYY-MM-DD", năm mặc định là 2026 nếu không có)
- returnHour: Giờ trả máy (0-23)
- returnMinute: Phút trả máy (0-59)
- totalFee: Tổng phí thuê (số nguyên, đơn vị nghìn đồng -> nhân 1000. Ví dụ: "120" -> 120000)
- depositAmount: Tiền đã đặt cọc (số nguyên, đơn vị nghìn đồng -> nhân 1000. Ví dụ: "50" -> 50000)
- customerName: Tên khách hàng (mặc định "Khách chatbot" nếu không rõ)
- platforms: Mảng các nền tảng liên hệ (ví dụ: ["TikTok"], ["Facebook", "Zalo"]. Mặc định ["Khác"])

Lưu ý các nhãn mới: "Tên khách hàng", "Số điện thoại", "Thiết bị", "Thời gian nhận máy", "Thời gian trả máy", "Đã đặt cọc".
Chỉ trả về JSON, không giải thích thêm. Nếu không tìm thấy thông tin nào, để giá trị là null.`;

/**
 * Fast-path parsing using Regex for the standard Kantra template
 */
function tryFastParse(message: string) {
    try {
        const pickupMatch = message.match(/(?:^|\n)[- \t]*Thời gian nhận(?: máy)?:?\s*(\d{1,2}:\d{2}),\s*(\d{1,2}\/\d{1,2})/i);
        const returnMatch = message.match(/(?:^|\n)[- \t]*Thời gian trả(?: máy)?:?\s*(\d{1,2}:\d{2}),\s*(\d{1,2}\/\d{1,2})/i);
        const cameraMatch = message.match(/(?:^|\n)[- \t]*(?:Máy|Thiết bị):?\s*([^\n\r]+)/i);
        const phoneMatch = message.match(/(?:^|\n)[- \t]*(?:SĐT|SDT|Số điện thoại):?\s*(\d+)/i);
        const depositMatch = message.match(/(?:^|\n)[- \t]*(?:Đã cọc|Đã đặt cọc):?\s*([\d.]+)/i);
        const feeMatch = message.match(/(?:^|\n)[- \t]*Tổng phí thuê:?\s*([\d.]+)/i);
        const nameMatch = message.match(/(?:^|\n)[- \t]*(?:Tên Khách|Tên khách hàng):?\s*([^\n\r]+)/i);
        const platformMatch = message.match(/(?:^|\n)[- \t]*Nền tảng:?\s*([^\n\r]+)/i);

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
        const supabase = await createClient();
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
        if (!parsed.pickupDate || !parsed.returnDate || parsed.pickupHour === null || parsed.pickupHour === undefined || parsed.returnHour === null || parsed.returnHour === undefined) {
            return NextResponse.json({
                data: parsed,
                error: 'Không thể xác định thời gian nhận/trả máy',
            });
        }

        const pickupTime = new Date(parsed.pickupDate);
        pickupTime.setHours(parsed.pickupHour ?? 0, parsed.pickupMinute ?? 0, 0, 0);

        const returnTime = new Date(parsed.returnDate);
        returnTime.setHours(parsed.returnHour ?? 0, parsed.returnMinute ?? 0, 0, 0);

        // Step 3: Check camera availability using direct DB call
        const { data: availableCameras, error: availError } = await supabase.rpc('get_available_cameras', {
            p_pickup_time: pickupTime.toISOString(),
            p_return_time: returnTime.toISOString(),
        });

        if (availError) {
            return NextResponse.json({
                data: parsed,
                error: `Lỗi kiểm tra máy trống: ${availError.message}`,
            });
        }

        // Find the camera by name (smart matching with priority)
        const cameraName = parsed.cameraName?.toLowerCase().trim() || '';

        // Priority 1: Exact match
        let simpleMatched = (availableCameras || []).find((c: any) =>
            c.name?.toLowerCase().trim() === cameraName
        );

        // Priority 2: Extract model number and match exactly (e.g., "M100" should not match "M10")
        if (!simpleMatched) {
            const modelMatch = cameraName.match(/([a-z]+\s*)(\d+)/i);
            if (modelMatch) {
                const modelPrefix = modelMatch[1].trim().toLowerCase();
                const modelNumber = modelMatch[2];
                simpleMatched = (availableCameras || []).find((c: any) => {
                    const camName = c.name?.toLowerCase() || '';
                    const camModelMatch = camName.match(/([a-z]+\s*)(\d+)/i);
                    if (camModelMatch) {
                        return camModelMatch[1].trim().toLowerCase() === modelPrefix &&
                            camModelMatch[2] === modelNumber;
                    }
                    return false;
                });
            }
        }

        // Priority 3: Best partial match (prefer longer matches)
        if (!simpleMatched) {
            const candidates = (availableCameras || []).filter((c: any) =>
                c.name?.toLowerCase().includes(cameraName) ||
                cameraName.includes(c.name?.toLowerCase())
            );
            // Sort by name length descending to prefer more specific matches
            candidates.sort((a: any, b: any) => (b.name?.length || 0) - (a.name?.length || 0));
            simpleMatched = candidates[0];
        }

        if (!simpleMatched) {
            return NextResponse.json({
                data: parsed,
                available: false,
                error: `Không tìm thấy hoặc máy "${parsed.cameraName}" không còn trống trong khung giờ này`,
            });
        }

        // Fetch full camera details to get all price rates
        const { data: cameras, error: cameraError } = await supabase
            .from('cameras')
            .select('*')
            .eq('is_active', true);

        if (cameraError) {
            return NextResponse.json({
                data: parsed,
                error: `Lỗi lấy danh sách máy: ${cameraError.message}`,
            });
        }

        const fullCamera = cameras?.find((c: any) => c.id === (simpleMatched.id || simpleMatched.camera_id));

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
        let customerId: string | null = null;

        if (parsed.customerPhone) {
            // Search for existing customer
            const { data: existingCustomers } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', parsed.customerPhone);

            if (existingCustomers && existingCustomers.length > 0) {
                customerId = existingCustomers[0].id;
            } else {
                // Create new customer
                const { data: newCustomer, error: createError } = await supabase
                    .from('customers')
                    .insert({
                        name: parsed.customerName || 'Khách chatbot',
                        phone: parsed.customerPhone,
                        platforms: parsed.platforms || ['Khác'],
                    })
                    .select()
                    .single();

                if (createError) {
                    return NextResponse.json({
                        data: parsed,
                        error: `Lỗi tạo khách hàng: ${createError.message}`,
                    });
                }

                customerId = newCustomer?.id || null;
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
        const { data: employees } = await supabase
            .from('employees')
            .select('id')
            .eq('is_active', true)
            .limit(1);

        const activeStaff = employees?.[0]?.id || null;

        // Step 7: Create booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                customer_id: customerId,
                created_by: activeStaff,
                pickup_time: pickupTime.toISOString(),
                return_time: returnTime.toISOString(),
                payment_status: (parsed.depositAmount ?? 0) > 0 ? 'deposited' : 'pending',
                deposit_type: (parsed.depositAmount ?? 0) > 0 ? 'custom' : 'none',
                deposit_amount: parsed.depositAmount ?? 0,
                total_rental_fee: calculatedFee,
                final_fee: calculatedFee,
                total_delivery_fee: 0,
            })
            .select()
            .single();

        if (bookingError) {
            return NextResponse.json({
                data: parsed,
                available: true,
                camera: fullCamera,
                error: `Lỗi tạo booking: ${bookingError.message}`,
            });
        }

        // Create booking items
        const { error: itemsError } = await supabase
            .from('booking_items')
            .insert({
                booking_id: booking.id,
                camera_id: fullCamera.id,
                quantity: 1,
                unit_price: calculatedFee,
                subtotal: calculatedFee,
            });

        if (itemsError) {
            // Rollback booking
            await supabase.from('bookings').delete().eq('id', booking.id);
            return NextResponse.json({
                data: parsed,
                error: `Lỗi tạo booking items: ${itemsError.message}`,
            });
        }

        // Create tasks
        const { error: tasksError } = await supabase
            .from('tasks')
            .insert([
                {
                    booking_id: booking.id,
                    type: 'pickup',
                    due_at: pickupTime.toISOString(),
                },
                {
                    booking_id: booking.id,
                    type: 'return',
                    due_at: returnTime.toISOString(),
                },
            ]);

        if (tasksError) {
            console.error('Tasks creation error (non-fatal):', tasksError.message);
        }

        return NextResponse.json({
            data: parsed,
            available: true,
            camera: fullCamera,
            booking: booking,
            success: true,
            isFastPath,
        });

    } catch (error: any) {
        console.error('Error in chatbot:', error);
        return NextResponse.json(
            { error: `Đã xảy ra lỗi khi xử lý: ${error?.message || 'Unknown'}` },
            { status: 500 }
        );
    }
}
