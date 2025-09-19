'use client'
import React from "react";
import '../styles/globals.css'

export type FooterProps = {
  text?: string
}

export const Footer: React.FC<FooterProps> = ({ text = "© 2025 E-tianguis" }) => {
  return (
    <footer className={'footer'}>
      <p>{text}</p>
      <p>
        <a href="#">Política de privacidad</a> | <a href="#">Términos de uso</a>
      </p>
    </footer>
  )
}