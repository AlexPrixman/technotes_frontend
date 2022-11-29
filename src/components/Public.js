import { Link } from "react-router-dom";

import React from 'react'

const Public = () => {
    const content = (
    <section className="public">
        <header>
            <h1>Welcome to <span className="nowrap"> Primium MJ Servicios! </span></h1>
        </header>
        <main className="public_main">
            <p> En la misma avenida, cercano a Occidental Mall y Laboratorios Ethical, 
                Primium MJ Servicios provee todo tipo de lubricantes para vehiculos de motor, servicios de 
                cambio de aceite, bandas de frenos y demas.</p>
            <address className="public_addr">
            Primium MJ Servicios <br/>
            Prolongacion 27 de Febrero #1188 <br/>
            Alameda, Santo Domingo Oeste.
            <a href="tel:+18095618799">(809)561-8799</a>
            </address>
            <br/>
            <p>Owner: Michael Jimenez</p>
        </main>
    </section>
    )  
  return content
}

export default Public