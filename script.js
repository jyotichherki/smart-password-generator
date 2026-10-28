
const passwordInput = document.getElementById("password");
const lengthSlider = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

const uppercase = document.getElementById("uppercase");
const lowercase = document.getElementById("lowercase");
const numbers = document.getElementById("numbers");
const symbols = document.getElementById("symbols");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const strengthText = document.getElementById("strengthText");
const strengthBar = document.getElementById("strengthBar");
const error = document.getElementById("error");
const toast = document.getElementById("toast");

const characterSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{};:,.?"
};

// Secure random integer from 0 up to (but not including) max.
function secureRandomInt(max) {
  if (!Number.isSafeInteger(max) || max < 1) {
    throw new Error("Invalid random range.");
  }

  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const randomValues = new Uint32Array(1);
  let value;

  do {
    crypto.getRandomValues(randomValues);
    value = randomValues[0];
  } while (value >= limit);

  return value % max;
}

// Select a random character from a string.
function randomCharacter(characters) {
  return characters[secureRandomInt(characters.length)];
}

// Update the number beside the length slider.
lengthSlider.addEventListener("input", () => {
  lengthValue.textContent = lengthSlider.value;
});

// Calculate a simple strength estimate.
function updateStrength(password, poolSize) {
  const length = password.length;
  const entropy = length * Math.log2(poolSize);

  let label;
  let percentage;
  let color;

  if (entropy < 45) {
    label = "Weak";
    percentage = 25;
    color = "#ef4444";
  } else if (entropy < 70) {
    label = "Medium";
    percentage = 50;
    color = "#f59e0b";
  } else if (entropy < 100) {
    label = "Strong";
    percentage = 75;
    color = "#84cc16";
  } else {
    label = "Very Strong";
    percentage = 100;
    color = "#22c55e";
  }

  strengthText.textContent = label;
  strengthText.style.color = color;
  strengthBar.style.width = percentage + "%";
  strengthBar.style.background = color;
}

// Show a toast message.
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Generate a secure password.
function generatePassword() {
  error.textContent = "";

  const length = Number(lengthSlider.value);
  const selectedSets = [];

  if (uppercase.checked) {
    selectedSets.push(characterSets.uppercase);
  }

  if (lowercase.checked) {
    selectedSets.push(characterSets.lowercase);
  }

  if (numbers.checked) {
    selectedSets.push(characterSets.numbers);
  }

  if (symbols.checked) {
    selectedSets.push(characterSets.symbols);
  }

  if (selectedSets.length === 0) {
    passwordInput.value = "";
    strengthText.textContent = "Not generated";
    strengthBar.style.width = "0";
    error.textContent = "Please select at least one character type.";
    return;
  }

  if (!window.crypto || !crypto.getRandomValues) {
    error.textContent = "Secure random generation is not supported.";
    return;
  }

  try {
    const allCharacters = selectedSets.join("");
    const passwordCharacters = [];

    // Ensure at least one character from each selected set.
    for (const set of selectedSets) {
      passwordCharacters.push(randomCharacter(set));
    }

    // Fill the remaining password length.
    while (passwordCharacters.length < length) {
      passwordCharacters.push(randomCharacter(allCharacters));
    }

    // Securely shuffle the characters.
    for (let i = passwordCharacters.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);

      [passwordCharacters[i], passwordCharacters[j]] =
        [passwordCharacters[j], passwordCharacters[i]];
    }

    const password = passwordCharacters.join("");

    passwordInput.value = password;
    updateStrength(password, allCharacters.length);
  } catch (err) {
    passwordInput.value = "";
    error.textContent = "Could not generate a password. Please try again.";
  }
}

// Generate a password when the button is clicked.
generateBtn.addEventListener("click", generatePassword);

// Copy the password to the clipboard.
copyBtn.addEventListener("click", async () => {
  const password = passwordInput.value;

  if (!password) {
    showToast("Generate a password first!");
    return;
  }

  try {
    await navigator.clipboard.writeText(password);
    showToast("Password copied successfully! ✓");
  } catch (err) {
    // Fallback for browsers where Clipboard API is unavailable.
    try {
      passwordInput.focus();
      passwordInput.select();

      const copied = document.execCommand("copy");
      passwordInput.setSelectionRange(0, 0);

      if (!copied) {
        throw new Error("Copy failed");
      }

      showToast("Password copied successfully! ✓");
    } catch (copyError) {
      showToast("Copy failed. Please copy it manually.");
    }
  }
});

// Generate the first password when the page opens.
generatePassword();
