/// <reference types="cypress" />

describe('Flujo completo de compra (Carrito + Dirección + Pago)', () => {

  it('Realiza un flujo completo de compra', () => {
    cy.visit('http://localhost:3000');

    // Ir a la categoría
    cy.visit('http://localhost:3000/category');

    // Agregar el primer producto al carrito
    cy.get('[data-testid="add-to-cart"]').first().click();

    // Ir al carrito
    cy.get('[data-testid="go-to-cart"]').click();
    cy.url().should('include', '/cart');

    // Verificar que aparece el producto
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);

    // Ir al checkout
    cy.visit('http://localhost:3000/checkout');

    // Llenar formulario
    cy.get('input[name="fullName"]').type('Luis Gutiérrez');
    cy.get('input[name="email"]').type('luis.test@example.com');
    cy.get('input[name="phone"]').type('5512345678');
    cy.get('#country').select('Mexico');
    cy.wait(1000);
    cy.get('#state').select(1);
    cy.wait(1000);
    cy.get('#city').select(1);
    cy.get('#street').type('Av. Principal 123');
    cy.get('#postalCode').type('12345');

    cy.get('[data-testid="continue-to-payment"]').click();
    cy.url().should('include', '/payment');

    cy.get('[data-testid="shippingMethod"]').select('Exprés');
    cy.get('input[value="card"]').check();

    cy.get('[data-testid="pay-now"]').click();

    cy.url().should('include', '/success');
  });

});
