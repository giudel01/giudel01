/**
 * ServiceNow Incident Form — JavaScript
 *
 * Comunicazione con il backend tramite ServiceNow Table API REST.
 * Endpoint: /api/now/table/incident  (POST)
 *
 * Nota: quando il file è ospitato come UI Page in ServiceNow,
 * le chiamate usano URL relativi e l'autenticazione è gestita
 * dalla sessione attiva dell'utente.
 */

(function () {
  "use strict";

  /* ── Configurazione ──────────────────────────────────────────── */
  const API_ENDPOINT = "/api/now/table/incident";

  /* ── Riferimenti DOM ─────────────────────────────────────────── */
  const form             = document.getElementById("incidentForm");
  const shortDescInput   = document.getElementById("shortDescription");
  const prioritySelect   = document.getElementById("priority");
  const submitBtn        = document.getElementById("submitBtn");
  const spinner          = document.getElementById("spinner");
  const btnText          = submitBtn.querySelector(".btn-text");
  const charCount        = document.getElementById("charCount");
  const shortDescError   = document.getElementById("shortDescriptionError");
  const priorityError    = document.getElementById("priorityError");
  const alertBox         = document.getElementById("alertBox");
  const alertIcon        = document.getElementById("alertIcon");
  const alertTitle       = document.getElementById("alertTitle");
  const alertMessage     = document.getElementById("alertMessage");
  const alertClose       = document.getElementById("alertClose");

  /* ── Contatore caratteri ─────────────────────────────────────── */
  shortDescInput.addEventListener("input", function () {
    const len = this.value.length;
    charCount.textContent = len + " / 160";
    if (len > 0) clearFieldError(shortDescInput, shortDescError);
  });

  /* ── Chiusura alert ──────────────────────────────────────────── */
  alertClose.addEventListener("click", hideAlert);

  /* ── Submit del form ─────────────────────────────────────────── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideAlert();

    if (!validateForm()) return;

    const payload = {
      short_description: shortDescInput.value.trim(),
      priority:          prioritySelect.value
    };

    createIncident(payload);
  });

  /* ── Validazione ─────────────────────────────────────────────── */
  function validateForm() {
    let valid = true;

    if (shortDescInput.value.trim() === "") {
      showFieldError(shortDescInput, shortDescError, "La Short Description è obbligatoria.");
      valid = false;
    } else {
      clearFieldError(shortDescInput, shortDescError);
    }

    if (prioritySelect.value === "") {
      showFieldError(prioritySelect, priorityError, "Seleziona una priorità.");
      valid = false;
    } else {
      clearFieldError(prioritySelect, priorityError);
    }

    return valid;
  }

  function showFieldError(field, errorEl, message) {
    field.classList.add("invalid");
    errorEl.textContent = message;
  }

  function clearFieldError(field, errorEl) {
    field.classList.remove("invalid");
    errorEl.textContent = "";
  }

  /* ── Chiamata Table API ──────────────────────────────────────── */
  function createIncident(payload) {
    setLoading(true);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_ENDPOINT, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;

      setLoading(false);

      if (xhr.status === 201) {
        handleSuccess(xhr.responseText);
      } else {
        handleError(xhr.status, xhr.responseText);
      }
    };

    xhr.onerror = function () {
      setLoading(false);
      showAlert(
        "error",
        "Errore di rete",
        "Impossibile contattare il server. Verifica la connessione e riprova."
      );
    };

    xhr.send(JSON.stringify(payload));
  }

  /* ── Gestione risposta ───────────────────────────────────────── */
  function handleSuccess(responseText) {
    var incidentNumber = "";

    try {
      var data = JSON.parse(responseText);
      incidentNumber = data.result && data.result.number
        ? " Numero: " + data.result.number + "."
        : "";
    } catch (e) {
      /* risposta non JSON: ignoriamo il numero */
    }

    showAlert(
      "success",
      "Incident creato con successo!",
      "Il tuo incident è stato registrato." + incidentNumber
    );

    form.reset();
    charCount.textContent = "0 / 160";
  }

  function handleError(status, responseText) {
    var detail = "";

    try {
      var data = JSON.parse(responseText);
      detail = data.error && data.error.message ? " Dettaglio: " + data.error.message : "";
    } catch (e) {
      /* nessun dettaglio disponibile */
    }

    var message;
    if (status === 401 || status === 403) {
      message = "Non sei autorizzato a creare incident. Verifica i permessi." + detail;
    } else if (status === 0) {
      message = "Richiesta annullata o server non raggiungibile." + detail;
    } else {
      message = "Si è verificato un errore (HTTP " + status + ")." + detail;
    }

    showAlert("error", "Errore durante la creazione", message);
  }

  /* ── UI helpers ──────────────────────────────────────────────── */
  function setLoading(loading) {
    submitBtn.disabled = loading;
    spinner.hidden     = !loading;
    btnText.textContent = loading ? "Invio in corso..." : "Crea Incident";
  }

  function showAlert(type, title, message) {
    alertBox.className    = "alert " + type;
    alertIcon.textContent = type === "success" ? "✔" : "✖";
    alertTitle.textContent   = title;
    alertMessage.textContent = message;
    alertBox.hidden = false;
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    alertBox.hidden = true;
    alertBox.className = "alert";
  }
})();
