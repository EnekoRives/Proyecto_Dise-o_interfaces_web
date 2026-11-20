const coffeeForm = document.getElementById("coffee-form");

if (coffeeForm instanceof HTMLFormElement) {
  const confirmation = document.getElementById("coffee-confirmation");

  coffeeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const amount = coffeeForm.querySelector('input[name="amount"]:checked');
    if (!(amount instanceof HTMLInputElement) || !confirmation) {
      return;
    }

    confirmation.textContent = `¡Gracias! Hemos registrado tu intención de donar ${amount.value} €. Esta demo no realiza el pago ni envía o guarda datos.`;
    confirmation.hidden = false;
  });
}
