const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const completionChart = document.querySelector('[data-completion-chart]');

if (completionChart) {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const chartWrap = completionChart.parentElement;

  const createSvgElement = (tag, attributes = {}, text = '') => {
    const element = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    if (text) element.textContent = text;
    return element;
  };

  const completionProbability = (openCount) => {
    if (openCount < 4) return 0;
    return (openCount * (openCount - 1) * (openCount - 2) * (openCount - 3)) /
      (200 * 199 * 198 * 197) * 100;
  };

  const drawCompletionChart = () => {
    const width = Math.max(300, Math.round(chartWrap.clientWidth));
    const compact = width < 560;
    const height = compact ? 300 : 340;
    const margin = compact
      ? { top: 42, right: 18, bottom: 54, left: 54 }
      : { top: 42, right: 24, bottom: 58, left: 66 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const x = (value) => margin.left + (value / 200) * plotWidth;
    const y = (value) => margin.top + plotHeight - (value / 100) * plotHeight;

    completionChart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    completionChart.replaceChildren();

    completionChart.append(
      createSvgElement('title', {}, '개봉 횟수에 따른 핵심 보상 4종 전체 수집 완료 확률'),
      createSvgElement('desc', {}, '100회 완료 확률은 6.1%, 150회는 31.3%입니다. 평균 완료 시점은 160.8회, 절반이 완료하는 시점은 169회, 95% 이상이 완료하는 시점은 198회입니다.')
    );

    [0, 25, 50, 75, 100].forEach((tick) => {
      completionChart.append(
        createSvgElement('line', {
          x1: margin.left,
          y1: y(tick),
          x2: width - margin.right,
          y2: y(tick),
          class: 'completion-grid'
        }),
        createSvgElement('text', {
          x: margin.left - 9,
          y: y(tick) + 4,
          'text-anchor': 'end',
          class: 'completion-axis'
        }, `${tick}%`)
      );
    });

    const xTicks = compact ? [0, 100, 150, 200] : [0, 50, 100, 150, 200];
    xTicks.forEach((tick) => {
      completionChart.append(
        createSvgElement('line', {
          x1: x(tick),
          y1: y(0),
          x2: x(tick),
          y2: y(0) + 5,
          class: 'completion-grid'
        }),
        createSvgElement('text', {
          x: x(tick),
          y: y(0) + 22,
          'text-anchor': tick === 0 ? 'start' : tick === 200 ? 'end' : 'middle',
          class: 'completion-axis'
        }, `${tick}회`)
      );
    });

    completionChart.append(createSvgElement('rect', {
      x: margin.left,
      y: margin.top,
      width: plotWidth,
      height: plotHeight,
      class: 'completion-frame'
    }));

    const points = Array.from({ length: 201 }, (_, openCount) => [
      x(openCount),
      y(completionProbability(openCount))
    ]);
    const linePath = points
      .map(([pointX, pointY], index) => `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)},${pointY.toFixed(2)}`)
      .join(' ');
    const areaPath = `${linePath} L${x(200).toFixed(2)},${y(0).toFixed(2)} L${x(0).toFixed(2)},${y(0).toFixed(2)} Z`;

    completionChart.append(
      createSvgElement('path', { d: areaPath, class: 'completion-area' }),
      createSvgElement('line', {
        x1: x(160.8),
        y1: margin.top,
        x2: x(160.8),
        y2: y(0),
        class: 'completion-mean-line'
      }),
      createSvgElement('text', {
        x: x(160.8) - 7,
        y: margin.top + 15,
        'text-anchor': 'end',
        class: 'completion-mean-label'
      }, '평균 160.8회'),
      createSvgElement('path', { d: linePath, class: 'completion-line' })
    );

    const markerSpecs = compact
      ? [
          { n: 100, label: '6.1%', dx: 0, dy: -10, anchor: 'middle' },
          { n: 150, label: '', dx: 0, dy: 0, anchor: 'middle' },
          { n: 169, label: '50% · 169회', dx: -8, dy: -10, anchor: 'end', key: true },
          { n: 198, label: '96% · 198회', dx: -8, dy: 20, anchor: 'end', key: true }
        ]
      : [
          { n: 100, label: '100회 · 6.1%', dx: -8, dy: -10, anchor: 'end' },
          { n: 150, label: '150회 · 31.3%', dx: -8, dy: -10, anchor: 'end' },
          { n: 169, label: '50% 완료 · 169회', dx: 10, dy: 18, anchor: 'start', key: true },
          { n: 198, label: '96.0% · 198회', dx: -8, dy: 20, anchor: 'end', key: true }
        ];

    markerSpecs.forEach(({ n, label, dx, dy, anchor, key }) => {
      const probability = completionProbability(n);
      const circle = createSvgElement('circle', {
        cx: x(n),
        cy: y(probability),
        r: key ? 5 : 4,
        class: `completion-point${key ? ' key' : ''}`
      });
      circle.append(createSvgElement('title', {}, `${n}회: ${probability.toFixed(2)}% 완료`));
      completionChart.append(circle);
      if (label) {
        completionChart.append(createSvgElement('text', {
          x: x(n) + dx,
          y: y(probability) + dy,
          'text-anchor': anchor,
          class: 'completion-point-label'
        }, label));
      }
    });

    completionChart.append(
      createSvgElement('text', {
        x: margin.left + plotWidth / 2,
        y: height - 8,
        'text-anchor': 'middle',
        class: 'completion-axis-title'
      }, '누적 개봉 횟수'),
      createSvgElement('text', {
        x: 15,
        y: margin.top + plotHeight / 2,
        transform: `rotate(-90 15 ${margin.top + plotHeight / 2})`,
        'text-anchor': 'middle',
        class: 'completion-axis-title'
      }, '4종 전체 수집 확률')
    );
  };

  drawCompletionChart();
  new ResizeObserver(drawCompletionChart).observe(chartWrap);
}
