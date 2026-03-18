(function () {
  const PRODUCTS_DATA_URL = "https://raw.githubusercontent.com/LolS1ZE/WARP_Links/main/products.csv";
  const fallbackVideo = "https://cdn.jsdelivr.net/gh/LolS1ZE/WARP_Links/0000-0090.mp4";
  const root = document.getElementById("warp-product-page");
  const index = Math.max(0, (parseInt(root.dataset.productIndex || "1", 10) || 1) - 1);

  const fallbackItems = Array.from({ length: 12 }, function (_, i) {
    return {
      src: fallbackVideo,
      title: "Продукт " + String(i + 1).padStart(2, "0"),
      collection: "Коллекция",
      hashtags: ["мерч", "warp"],
      price: 2500
    };
  });

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateDesktopScale() {
    const widthScale = window.innerWidth / 2570;
    const heightScale = window.innerHeight / 1440;
    const scale = clamp(Math.min(widthScale, heightScale), 0.68, 1);
    root.style.setProperty("--desktop-scale", String(scale));
  }

  function normalizeGithubUrl(url) {
    if (url.indexOf("raw.githubusercontent.com") !== -1) {
      return url;
    }

    if (url.indexOf("github.com") !== -1 && url.indexOf("/blob/") !== -1) {
      return url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    }

    return url;
  }

  function buildFreshDataUrl(url) {
    const normalized = normalizeGithubUrl(url);
    const separator = normalized.indexOf("?") === -1 ? "?" : "&";
    return normalized + separator + "ts=" + Date.now();
  }

  function parseDelimited(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
    if (!lines.length) {
      return [];
    }

    const separator = lines[0].indexOf("\t") !== -1 ? "\t" : lines[0].indexOf(";") !== -1 ? ";" : ",";
    return lines.map(function (line) {
      return line.split(separator).map(function (cell) {
        return cell.trim();
      });
    });
  }

  function rowToItem(row, rowIndex) {
    const rawPrice = String(row[4] || "").replace(/[^\d.,]/g, "").replace(",", ".");
    const price = Number.parseFloat(rawPrice);
    return {
      src: row[0] || fallbackVideo,
      title: row[1] || "Продукт " + String(rowIndex + 1).padStart(2, "0"),
      collection: row[2] || "Коллекция",
      hashtags: (row[3] || "")
        .split(/\s+/)
        .map(function (tag) {
          return tag.replace(/^#/, "").trim();
        })
        .filter(Boolean),
      price: Number.isFinite(price) ? Math.round(price) : 2500
    };
  }

  function render(item, items) {
    document.getElementById("wppTitle").textContent = item.title.toUpperCase();
    document.getElementById("wppCollection").textContent = item.collection.toUpperCase();
    document.getElementById("wppVideo").src = item.src;
    document.getElementById("wppBackdropVideo").src = item.src;
    document.getElementById("wppPrice").textContent = item.price.toLocaleString("ru-RU") + " ₽";

    const tagsNode = document.getElementById("wppTags");
    tagsNode.innerHTML = "";
    const tags = item.hashtags && item.hashtags.length ? item.hashtags : ["добавьте", "хештеги"];
    tags.forEach(function (tag) {
      const node = document.createElement("div");
      node.className = "wpp-tag";
      node.innerHTML = '<span>#</span><span>' + tag + "</span>";
      tagsNode.appendChild(node);
    });

    const prevIndex = (index + items.length - 1) % items.length;
    const nextIndex = (index + 1) % items.length;
    document.getElementById("wppPrev").onclick = function () {
      window.location.href = "http://warpstart.tilda.ws/product-" + String(prevIndex + 1).padStart(2, "0");
    };
    document.getElementById("wppNext").onclick = function () {
      window.location.href = "http://warpstart.tilda.ws/product-" + String(nextIndex + 1).padStart(2, "0");
    };
    document.getElementById("wppClose").onclick = function () {
      window.location.href = "https://warpstart.tilda.ws/mag";
    };
  }

  async function init() {
    updateDesktopScale();
    let items = fallbackItems;

    try {
      const response = await fetch(buildFreshDataUrl(PRODUCTS_DATA_URL), { cache: "no-store" });
      if (response.ok) {
        const text = await response.text();
        const rows = parseDelimited(text).filter(function (row) {
          return row.some(Boolean);
        });
        const dataRows = rows.length && /video|url|ссылка/i.test(rows[0][0]) ? rows.slice(1) : rows;
        if (dataRows.length) {
          items = dataRows.slice(0, 12).map(rowToItem);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки products.csv:", error);
    }

    render(items[index] || fallbackItems[index], items);
    window.addEventListener("resize", updateDesktopScale);
  }

  init();
})();
