"""고정한 공개 시세 데이터에서 포트폴리오용 SVG·고해상도 PNG를 출력한다."""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.lines import Line2D
from matplotlib.patches import Patch, Rectangle
from matplotlib.ticker import FuncFormatter, MultipleLocator

assets = Path(__file__).resolve().parents[1] / "assets"
data = json.loads((assets / "dnf-candles-20260909.json").read_text(encoding="utf-8"))
font_path = Path("C:/Windows/Fonts/malgun.ttf")
if font_path.exists():
    font_manager.fontManager.addfont(font_path)
plt.rcParams.update({"font.family": "Malgun Gothic", "axes.unicode_minus": False,
                     "svg.fonttype": "path", "font.size": 11})

daily, forecast = data["daily"], data["forecast"]["points"]
day = lambda value: datetime.strptime(value, "%Y-%m-%d")
built = datetime.fromisoformat(data["builtAt"].replace("Z", "+00:00")).astimezone(timezone(timedelta(hours=9)))
today = day(built.strftime("%Y-%m-%d"))
first, last = day(daily[0]["d"]), day(forecast[-1]["d"])
up, down, ink, blue = "#dc3948", "#267be8", "#20262e", "#2869ce"

fig = plt.figure(figsize=(12, 6.75), facecolor="white")
ax = fig.add_axes([0.085, 0.245, 0.885, 0.48])
fig.text(0.055, 0.925, data["itemName"], fontsize=22, weight="bold", color=ink)
fig.text(0.055, 0.873, "일별 가격 캔들 · 수량 가중평균(VWAP) · 7일 예측", fontsize=12, color="#586270")
fig.text(0.055, 0.823, f"Neople API 관측 {data['observedTrades']:,}건 · {data['grade']}등급  |  {built:%Y.%m.%d %H:%M} KST 데이터", fontsize=10, color="#697582")

ax.set_xlim(first - timedelta(days=0.8), last + timedelta(days=0.8))
ax.set_ylim(32_000_000, 46_000_000)
ax.set_axisbelow(True)
ax.grid(axis="y", color="#e7ebef", linewidth=0.8)
ax.yaxis.set_major_locator(MultipleLocator(2_000_000))
ax.yaxis.set_major_formatter(FuncFormatter(lambda value, _: f"{value / 10000:,.0f}"))
ax.tick_params(axis="both", colors="#66717f", labelsize=10, length=0, pad=10)
ax.set_ylabel("가격 (만 골드)", fontsize=10, color="#66717f", labelpad=12)
for spine in ax.spines.values():
    spine.set_visible(False)
ticks = ["2026-08-21", "2026-08-25", "2026-08-29", "2026-09-02", "2026-09-05", "2026-09-09", "2026-09-12", "2026-09-16"]
ax.set_xticks([day(d) for d in ticks], [day(d).strftime("%m.%d") for d in ticks])

ax.axvspan(today + timedelta(hours=12), last + timedelta(days=0.8), color="#f1f6fd", zorder=0)
ax.text(day("2026-09-13"), 45_350_000, "예측 구간", ha="center", color=blue, fontsize=10)
ax.axvline(today + timedelta(hours=12), color="#bed0eb", linewidth=1, linestyle=(0, (4, 4)))
ax.axvspan(day("2026-09-06") - timedelta(hours=12), day("2026-09-08") + timedelta(hours=12), color="#f5f6f7", zorder=0)
ax.text(day("2026-09-07"), 44_000_000, "관측봉\n없음", ha="center", va="center", fontsize=9, color="#7b8591", linespacing=1.6)

for bar in daily:
    x = mdates.date2num(day(bar["d"]))
    color = up if bar["c"] > bar["o"] else down if bar["c"] < bar["o"] else "#7c8794"
    ax.plot([x, x], [bar["l"], bar["h"]], color=color, linewidth=1.3, zorder=3)
    # 단일 가격 봉도 숨기지 않되 고가·저가 범위를 인위적으로 키우지 않는다.
    if bar["c"] == bar["o"]:
        ax.plot([x - 0.29, x + 0.29], [bar["c"], bar["c"]], color=color, linewidth=1.8, zorder=3)
    else:
        ax.add_patch(Rectangle((x - 0.29, min(bar["o"], bar["c"])), 0.58,
                               abs(bar["c"] - bar["o"]), facecolor=color, edgecolor=color, zorder=3))

# 관측이 없는 날짜는 NaN으로 남겨 실제 달력의 공백을 선으로 연결하지 않는다.
by_date = {bar["d"]: bar["vwap"] for bar in daily}
calendar = [first + timedelta(days=n) for n in range((today - first).days + 1)]
ax.plot(calendar, [by_date.get(d.strftime("%Y-%m-%d"), float("nan")) for d in calendar],
        color=ink, linewidth=1.4, marker=".", markersize=3, zorder=4)
xs = [day(daily[-1]["d"])] + [day(p["d"]) for p in forecast]
ys = [daily[-1]["vwap"]] + [p["mid"] for p in forecast]
ax.plot(xs, ys, color=blue, linewidth=1.6, linestyle=(0, (4, 3)), zorder=4)
ax.fill_between([day(p["d"]) for p in forecast], [p["lo"] for p in forecast],
                [p["hi"] for p in forecast], color=blue, alpha=0.10, linewidth=0)
ax.annotate("당일 미완성 봉", xy=(today, daily[-1]["vwap"]), xytext=(today - timedelta(days=2), 35_000_000),
            fontsize=9, color="#606c79", ha="center", arrowprops={"arrowstyle": "-", "color": "#8b96a3", "lw": 0.8})

legend = [Patch(color=up, label="상승 캔들"), Patch(color=down, label="하락 캔들"),
          Line2D([0], [0], color=ink, lw=1.5, label="일별 VWAP"),
          Line2D([0], [0], color=blue, lw=1.5, ls="--", label="VWAP 예측"),
          Patch(facecolor="#e4edfa", edgecolor="none", label="예측구간 (목표 80%)")]
fig.legend(handles=legend, loc="upper left", bbox_to_anchor=(0.055, 0.798), ncol=5,
           frameon=False, fontsize=9, handlelength=1.6, columnspacing=2)
fig.text(0.055, 0.137, "공개된 원본 집계 데이터로 다시 그린 차트입니다. 과거 조회 기록을 포함하며, 빈 날짜는 관측봉이 없는 구간입니다.", fontsize=9, color="#64707e")
fig.text(0.055, 0.089, "예측은 실측과 구분해 표시합니다. 목표 80% 구간은 포함 확률을 보장하지 않으며, 7일 뒤 예측의 평가 사례는 아직 없습니다.", fontsize=9, color="#64707e")
fig.text(0.055, 0.040, "데이터 출처: Neople Open API · DNF 경매장 시세 추적기", fontsize=9, color="#7c8794")

fig.savefig(assets / "dnf-candles-20260909-hd.svg")
fig.savefig(assets / "dnf-candles-20260909-hd.png", dpi=240)
plt.close(fig)
print("Exported SVG and 2880 × 1620 PNG")
