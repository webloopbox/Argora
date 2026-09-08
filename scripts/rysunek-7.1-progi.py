# Rysunek 7.1 (praca_pisemna.md, §7.3.2): precyzja, czułość i miara F1
# w funkcji progu podobieństwa kosinusowego.
#
# Dane pochodzą z Tabeli 7.3, policzonej przez scripts/eval-duplicate-detection.mjs
# na zbiorze 17 zgłoszeń (scripts/duplicate-eval-set.mjs). Wartości są tu wpisane
# wprost, żeby rysunek dał się odtworzyć bez dostępu do bazy i klucza Gemini.
#
# Styl (Calibri, czerń, rozróżnienie krzywych stylem linii i znacznikiem, nie
# kolorem) dopasowany do pozostałych rysunków w katalogu rysunki/ - praca jest
# drukowana w skali szarości.
#
# Uruchomienie:
#   python scripts/rysunek-7.1-progi.py

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

# Tabela 7.3, wiersze progów semantycznych (bez wiersza odniesienia leksykalnego,
# które nie leży na tej samej skali odciętych).
PROGI = [0.50, 0.60, 0.70, 0.75, 0.80, 0.90]
PRECYZJA = [0.47, 0.47, 0.50, 0.67, 0.80, 1.00]
CZULOSC = [1.00, 1.00, 1.00, 1.00, 1.00, 0.67]
F1 = [0.64, 0.64, 0.67, 0.80, 0.89, 0.80]

PROG_WDROZONY = 0.80

plt.rcParams["font.family"] = ["Calibri", "Arial", "sans-serif"]
plt.rcParams["font.size"] = 11

fig, ax = plt.subplots(figsize=(7.5, 4.6), dpi=200)
fig.patch.set_facecolor("white")
ax.set_facecolor("white")

# Linia pomocnicza progu wdrożonego - rysowana pod krzywymi.
ax.axvline(
    PROG_WDROZONY,
    color="#000000",
    linewidth=1.0,
    linestyle=(0, (1, 2)),
    zorder=1,
)
ax.annotate(
    "próg wybrany\nna podstawie badania (0,80)",
    xy=(PROG_WDROZONY, 0.30),
    xytext=(PROG_WDROZONY - 0.012, 0.30),
    ha="right",
    va="center",
    fontsize=9.5,
    color="#000000",
)

wspolne = dict(color="#000000", linewidth=1.6, markersize=6, zorder=3)
ax.plot(PROGI, PRECYZJA, linestyle="-", marker="o", markerfacecolor="#ffffff",
        label="Precyzja", **wspolne)
ax.plot(PROGI, CZULOSC, linestyle="--", marker="s", markerfacecolor="#000000",
        label="Czułość", **wspolne)
ax.plot(PROGI, F1, linestyle="-.", marker="^", markerfacecolor="#bfbfbf",
        label="F1", **wspolne)

ax.set_xlabel("Próg podobieństwa kosinusowego")
ax.set_ylabel("Wartość metryki")

ax.set_xlim(0.47, 0.93)
ax.set_ylim(0.0, 1.08)
ax.set_xticks(PROGI)
ax.set_yticks([0.0, 0.2, 0.4, 0.6, 0.8, 1.0])

przecinek = FuncFormatter(lambda v, _: f"{v:.2f}".replace(".", ","))
ax.xaxis.set_major_formatter(przecinek)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.1f}".replace(".", ",")))

ax.grid(True, color="#d9d9d9", linewidth=0.7, zorder=0)
ax.set_axisbelow(True)
for krawedz in ("top", "right"):
    ax.spines[krawedz].set_visible(False)
for krawedz in ("left", "bottom"):
    ax.spines[krawedz].set_color("#000000")

ax.legend(loc="lower left", frameon=True, framealpha=1.0, edgecolor="#000000",
          fontsize=10)

fig.tight_layout()
fig.savefig("rysunki/rysunek_7.1_progi.svg", format="svg", facecolor="white")
fig.savefig("rysunki/rysunek_7.1_progi.png", format="png", dpi=300, facecolor="white")
print("Zapisano rysunki/rysunek_7.1_progi.svg oraz .png")
