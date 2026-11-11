
const promptInput = document.getElementById("prompt");
const styleSelect = document.getElementById("style");
const ratioSelect = document.getElementById("ratio");
const countSelect = document.getElementById("count");
const galleryGrid = document.getElementById("gallery-grid");
const galleryFilter = document.getElementById("gallery-filter");
const generateBtn = document.getElementById("generate-btn");

const STORAGE_KEY = "pixelmind_demo_gallery";

const artworks = {
  realistic: [
    {
      image: "photo-1470252649378-9c29740c9fa8",
      title: "Golden Hour Landscape"
    },
    {
      image: "photo-1500530855697-b586d89ba3ee",
      title: "Dreamy Nature Escape"
    },
    {
      image: "photo-1518837695005-2083093ee35b",
      title: "Ocean Serenity"
    }
  ],
  digital: [
    {
      image: "photo-1462331940025-496dfbfc7564",
      title: "Cosmic Dream"
    },
    {
      image: "photo-1534796636912-3b95b3ab5986",
      title: "Beyond the Stars"
    },
    {
      image: "photo-1446776811953-b23d57bd21aa",
      title: "Planet Earth"
    }
  ],
  anime: [
    {
      image: "photo-1518709268805-4e9042af9f23",
      title: "Enchanted Forest"
    },
    {
      image: "photo-1511497584788-876760111969",
      title: "Forest Adventure"
    },
    {
      image: "photo-1473448912268-2022ce9509d8",
      title: "Quiet Woodland"
    }
  ],
  "3d": [
    {
      image: "photo-1634017839464-5c339ebe3cb4",
      title: "Abstract 3D Forms"
    },
    {
      image: "photo-1550745165-9bc0b252726f",
      title: "Retro Digital World"
    },
    {
      image: "photo-1518770660439-4636190af475",
      title: "Future Technology"
    }
  ],
  fantasy: [
    {
      image: "photo-1519681393784-d120267933ba",
      title: "Magical Mountain"
    },
    {
      image: "photo-1464822759023-fed622ff2c3b",
      title: "Kingdom in the Clouds"
    },
    {
      image: "photo-1470770841072-f978cf4d019e",
      title: "Fantasy Valley"
    }
  ],
  minimal: [
    {
      image: "photo-1494438639946-1ebd1d20bf85",
      title: "Minimal Workspace"
    },
    {
      image: "photo-1497366754035-f200968a6e72",
      title: "Clean Interior"
    },
    {
      image: "photo-1494438639946-1ebd1d20bf85",
      title: "Simple and Calm"
    }
  ]
};

const styleNames = {
  realistic: "Photorealistic",
  digital: "Digital Art",
  anime: "Anime",
  "3d": "3D Render",
  fantasy: "Fantasy",
  minimal: "Minimalist"
};

const samplePrompts = [
  "A magical city floating above pink clouds at sunset",
  "A tiny robot exploring a beautiful futuristic garden",
  "A dreamy purple galaxy with glowing stars and planets",
  "A peaceful mountain lake surrounded by misty forests",
  "A luxury futuristic room with soft lighting and elegant design",
  "A fantasy castle above the clouds under a violet sky"
];

function makeImageURL(imageId, width = 700) {
  return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=${width}&q=85`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getSavedGallery() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

let gallery = getSavedGallery();

function saveGallery() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
  } catch {
    showToast("Browser storage is full. Clear some gallery items.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function getCurrentStyle() {
  return styleSelect.value;
}

function renderGallery() {
  const filter = galleryFilter.value;

  const filtered = gallery.filter(item =>
    filter === "all" || item.style === filter
  );

  document.getElementById("gallery-empty").hidden =
    filtered.length !== 0;

  galleryGrid.innerHTML = filtered.map(item => {
    const image = escapeHTML(item.image);
    const title = escapeHTML(item.title);
    const style = escapeHTML(styleNames[item.style] || item.style);
    const prompt = escapeHTML(item.prompt);
    const ratioClass = escapeHTML(item.ratio || "square");

    return `
      <article class="gallery-card">
        <div class="gallery-image ${ratioClass}">
          <img
            src="${image}"
            alt="${title}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://placehold.co/700x500/ece6ff/34275c?text=Artwork+Preview'"
          >
          <span class="gallery-style">${style}</span>
        </div>

        <div class="gallery-info">
          <h3>${title}</h3>
          <p>${prompt || "Creative artwork preview"}</p>

          <div class="gallery-card-actions">
            <button data-copy="${item.id}">Copy Prompt</button>
            <button data-download="${item.id}">Open / Save Image</button>
            <button data-delete="${item.id}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function createPreview(prompt, style, ratio, index) {
  const choices = artworks[style] || artworks.realistic;
  const artwork = choices[index % choices.length];

  let title = prompt.trim();

  if (title.length > 65) {
    title = title.slice(0, 62) + "...";
  }

  return {
    id: Date.now() + index,
    title: title || artwork.title,
    prompt,
    style,
    ratio,
    image: makeImageURL(artwork.image),
    createdAt: new Date().toISOString()
  };
}

function generatePreview(event) {
  event.preventDefault();

  const prompt = promptInput.value.trim();

  if (!prompt) {
    showToast("Please write a prompt first.");
    promptInput.focus();
    return;
  }

  if (prompt.length > 500) {
    showToast("Please keep your prompt within 500 characters.");
    return;
  }

  const style = getCurrentStyle();
  const ratio = ratioSelect.value;
  const count = Number(countSelect.value);

  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span>✦</span> Preparing previews...';

  setTimeout(() => {
    const newItems = [];

    for (let i = 0; i < count; i++) {
      newItems.push(createPreview(prompt, style, ratio, i));
    }

    gallery = [...newItems, ...gallery].slice(0, 60);
    saveGallery();

    galleryFilter.value = "all";
    renderGallery();

    generateBtn.disabled = false;
    generateBtn.innerHTML =
      '<span>✦</span> Generate Preview <span class="arrow">↗</span>';

    document.getElementById("gallery").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    showToast(
      `${count} sample preview${count > 1 ? "s" : ""} added to your gallery!`
    );
  }, 900);
}

document.getElementById("generator-form")
  .addEventListener("submit", generatePreview);

promptInput.addEventListener("input", () => {
  document.getElementById("char-count").textContent =
    `${promptInput.value.length} / 500`;
});

document.getElementById("surprise-btn").addEventListener("click", () => {
  const randomIndex = Math.floor(Math.random() * samplePrompts.length);
  promptInput.value = samplePrompts[randomIndex];

  document.getElementById("char-count").textContent =
    `${promptInput.value.length} / 500`;

  styleSelect.value = ["fantasy", "digital", "3d", "realistic"][
    Math.floor(Math.random() * 4)
  ];

  showToast("A new creative idea is ready!");
  promptInput.focus();
});

document.getElementById("new-project").addEventListener("click", () => {
  promptInput.value = "";
  document.getElementById("char-count").textContent = "0 / 500";
  styleSelect.value = "realistic";
  ratioSelect.value = "square";
  countSelect.value = "1";

  document.getElementById("create").scrollIntoView({
    behavior: "smooth"
  });

  promptInput.focus();
});

galleryFilter.addEventListener("change", renderGallery);

document.getElementById("clear-gallery").addEventListener("click", () => {
  if (gallery.length === 0) {
    showToast("Your gallery is already empty.");
    return;
  }

  const confirmed = confirm("Do you want to clear your entire gallery?");
  if (!confirmed) return;

  gallery = [];
  saveGallery();
  renderGallery();
  showToast("Gallery cleared.");
});

galleryGrid.addEventListener("click", async event => {
  const copyButton = event.target.closest("[data-copy]");
  const downloadButton = event.target.closest("[data-download]");
  const deleteButton = event.target.closest("[data-delete]");

  if (copyButton) {
    const item = gallery.find(
      artwork => artwork.id === Number(copyButton.dataset.copy)
    );

    if (!item) return;

    try {
      await navigator.clipboard.writeText(item.prompt);
      showToast("Prompt copied!");
    } catch {
      promptInput.value = item.prompt;
      document.getElementById("char-count").textContent =
        `${item.prompt.length} / 500`;
      promptInput.focus();
      showToast("Prompt copied into the prompt box.");
    }
  }

  if (downloadButton) {
    const item = gallery.find(
      artwork => artwork.id === Number(downloadButton.dataset.download)
    );

    if (!item) return;

    // Opens the image so the user can save it using the browser.
    window.open(item.image, "_blank", "noopener,noreferrer");
    showToast("Image opened in a new tab. Save it from your browser.");
  }

  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);
    gallery = gallery.filter(item => item.id !== id);
    saveGallery();
    renderGallery();
    showToast("Artwork removed from gallery.");
  }
});

// Add a few example images when the gallery is first opened.
if (gallery.length === 0) {
  const examples = [
    {
      prompt: "A magical mountain landscape under a starry night sky",
      style: "fantasy",
      ratio: "landscape"
    },
    {
      prompt: "A dreamy cosmic world with colourful planets",
      style: "digital",
      ratio: "square"
    },
    {
      prompt: "A peaceful minimal nature scene",
      style: "minimal",
      ratio: "portrait"
    }
  ];

  gallery = examples.map((item, index) =>
    createPreview(item.prompt, item.style, item.ratio, index)
  );

  saveGallery();
}

renderGallery();
