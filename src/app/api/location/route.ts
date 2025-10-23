import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    return NextResponse.json({
      country_code: data.country_code || "MX",
      country_name: data.country_name || "México",
    });
  } catch (error) {
    console.error("Error al obtener ubicación:", error);
    return NextResponse.json(
      { country_code: "MX", country_name: "México" },
      { status: 200 }
    );
  }
}
