(() => {
  "use strict";

  const form = document.getElementById("certificate-form");
  const nameInput = document.getElementById("full-name");
  const errorText = document.getElementById("name-error");
  const resultSection = document.getElementById("result-section");
  const canvas = document.getElementById("certificate-canvas");
  const ctx = canvas.getContext("2d");
  const editButton = document.getElementById("edit-name");
  const pngButton = document.getElementById("download-png");
  const statusText = document.getElementById("download-status");

  const background = new Image();
  background.src = "certificado.png";
  background.decoding = "async";

  // Coordinates are based on the supplied 2574 x 1820 certificate image.
  const nameArea = {
    centerXRatio: 0.5,
    baselineYRatio: 0.475,
    maxWidthRatio: 0.62,
    maxFontRatio: 0.037,
    minFontRatio: 0.021
  };

  let currentName = "";

  function normalizeName(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function safeFileName(value) {
    return normalizeName(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "certificate";
  }

  function fitFontSize(text, maxWidth, maxSize, minSize) {
    let size = maxSize;
    while (size > minSize) {
      ctx.font = `600 ${size}px "Trebuchet MS", "Segoe UI", Arial, sans-serif`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 1;
    }
    return minSize;
  }

  function drawCertificate(name) {
    canvas.width = background.naturalWidth;
    canvas.height = background.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const maxWidth = canvas.width * nameArea.maxWidthRatio;
    const maxSize = canvas.width * nameArea.maxFontRatio;
    const minSize = canvas.width * nameArea.minFontRatio;
    const fontSize = fitFontSize(name, maxWidth, maxSize, minSize);

    ctx.save();
    ctx.font = `600 ${fontSize}px "Trebuchet MS", "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = "#4d19a1";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      name,
      canvas.width * nameArea.centerXRatio,
      canvas.height * nameArea.baselineYRatio,
      maxWidth
    );
    ctx.restore();
  }

  function generate() {
    const name = normalizeName(nameInput.value);

    if (name.length < 2) {
      errorText.textContent = "Please enter your full name.";
      nameInput.focus();
      return;
    }

    errorText.textContent = "";
    currentName = name;
    drawCertificate(currentName);
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (background.complete && background.naturalWidth) {
      generate();
    } else {
      statusText.textContent = "Loading the certificate design. Please try again in a moment.";
      background.addEventListener("load", generate, { once: true });
    }
  });

  editButton.addEventListener("click", () => {
    nameInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  pngButton.addEventListener("click", () => {
    if (!currentName) return;
    const link = document.createElement("a");
    link.download = `geppetto-certificate-${safeFileName(currentName)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    statusText.textContent = "PNG downloaded successfully.";
  });

  pdfButton.addEventListener("click", () => {
    if (!currentName) return;

    if (!window.jspdf || !window.jspdf.jsPDF) {
      statusText.textContent = "The PDF tool could not load. Please refresh the page or use Download PNG.";
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
      hotfixes: ["px_scaling"]
    });

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height, undefined, "FAST");
    pdf.save(`geppetto-certificate-${safeFileName(currentName)}.pdf`);
    statusText.textContent = "PDF downloaded successfully.";
  });

  background.addEventListener("error", () => {
    errorText.textContent = "The certificate image could not be loaded. Confirm that certificado.png is in the same folder as index.html.";
  });
})();
