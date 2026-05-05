import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, category, price, stock } = body;

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // ✅ USE SERVICE ROLE CLIENT (this fixes your error)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 👇 verify user from token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!user || error) {
      return NextResponse.json(
        { error: "Invalid user" },
        { status: 401 }
      );
    }

    // ✅ insert and return the inserted row for immediate client update
    const { data: insertedProduct, error: insertError } = await supabase
      .from("products")
      .insert({
        name,
        category,
        price,
        stock,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError || !insertedProduct) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to add product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: insertedProduct });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}