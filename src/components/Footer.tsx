'use client'
import React from "react";
import '../styles/globals.css'
import Link from "next/link";

export type FooterProps = {
  text?: string
}

export const Footer: React.FC<FooterProps> = ({ text = "© 2025 E-tianguis" }) => {
  return (
    <footer className={'footer'}>
      <p>{text}</p>
      <p>
        <Link href="/privacity">Política de privacidad</Link> | <Link href="/useTerms">Términos de uso</Link>
      </p>
    </footer>
  )
}