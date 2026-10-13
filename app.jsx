// --- Palette ---
// One colour per kind of thing, used by the inputs, both diagrams and the cut list.
const C = {
    block: '#2563eb', blockFill: '#bfdbfe',
    board: '#dc2626', boardFill: '#fecaca',
    spine: '#ca8a04', spineFill: '#fde68a',
    overhang: '#7c3aed',
    fabric: '#16a34a', fabricFill: '#f0fdf4',
    gutter: '#ea580c',
};

// --- Shared Geometry ---
// Fabric outline with 45° corner cuts that sit one board thickness away from each board corner.
const fabricOutlinePath = (dims, x0 = 0, y0 = 0) => {
    const c = Math.max(0, 2 * dims.fabricMargin - dims.boardT * Math.sqrt(2));
    const w = dims.fabricW, h = dims.fabricH;
    const pts = [[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]];
    return 'M ' + pts.map(([x, y]) => `${+(x0 + x).toFixed(3)} ${+(y0 + y).toFixed(3)}`).join(' L ') + ' Z';
};

const computeDims = ({ pageWidth, pageHeight, blockThickness, boardThickness, coverMargin, fabricMargin }) => {
    const boardW = pageWidth - 0.5 * blockThickness + coverMargin;
    const boardH = pageHeight + 2 * coverMargin;
    const spineW = blockThickness + 2 * boardThickness;
    const gutter = blockThickness / 2 + boardThickness;
    return {
        pageW: pageWidth, pageH: pageHeight, blockT: blockThickness, boardT: boardThickness,
        coverMargin, fabricMargin, boardW, boardH, spineW, gutter,
        fabricW: 2 * boardW + spineW + 2 * gutter + 2 * fabricMargin,
        fabricH: boardH + 2 * fabricMargin,
    };
};

// --- Diagram Helpers ---
// `active` is the key of the hovered/focused measurement; everything unrelated fades out.
const fade = (active, keys) => (active && !keys.includes(active) ? 0.25 : 1);

const Dim = ({ x1, y1, x2, y2, label, lx, ly, anchor = 'middle', color, keys, active, fs }) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (!(len > 0)) return null;
    const on = keys.includes(active);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const a = Math.min(fs * 0.45, len / 3);
    const head = (x, y, dx, dy) =>
        `${x},${y} ${x - dx * a - dy * a * 0.5},${y - dy * a + dx * a * 0.5} ${x - dx * a + dy * a * 0.5},${y - dy * a - dx * a * 0.5}`;
    return (
        <g opacity={fade(active, keys)} style={{ transition: 'opacity .15s' }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={fs * (on ? 0.18 : 0.09)}/>
            <polygon points={head(x2, y2, ux, uy)} fill={color}/>
            <polygon points={head(x1, y1, -ux, -uy)} fill={color}/>
            <text x={lx} y={ly} fontSize={fs} fontWeight={on ? 700 : 500} fill={color} textAnchor={anchor}
                  dominantBaseline="middle" stroke="white" strokeWidth={fs * 0.3} style={{ paintOrder: 'stroke' }}>{label}</text>
        </g>
    );
};

// --- Closed book seen from above (to scale) ---
const CrossSectionSVG = ({ d, active }) => {
    const { pageW, blockT, boardT, boardW, coverMargin, spineW, gutter, fabricMargin } = d;
    const W = gutter + boardW, H = spineW;
    const fs = Math.max(W, 120) / 34;
    const padL = fs * 3, padR = fs * 7.5, padT = fs * 2.6, padB = fs * 3;

    // Cloth wraps the outside, dips into the hinge joints and turns in on the inside of each board.
    const f = fs * 0.22, tin = Math.min(Math.max(0, fabricMargin - boardT), boardW);
    const dip = (gutter - boardT) * 0.5, hingeX = boardT + (gutter - boardT) / 2;
    const fabricPath = [
        [W - tin, boardT + f], [W + f, boardT + f], [W + f, -f], [gutter, -f], [hingeX, -f + dip], [boardT, -f], [-f, -f],
        [-f, H + f], [boardT, H + f], [hingeX, H + f - dip], [gutter, H + f], [W + f, H + f], [W + f, H - boardT - f], [W - tin, H - boardT - f],
    ].map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');

    const sw = fs * 0.1;
    const dimProps = { active, fs };
    return (
        <svg viewBox={`${-padL} ${-padT} ${W + padL + padR} ${H + padT + padB}`} className="w-full" role="img" aria-label="Cross-section of the closed book">
            <rect x={boardT} y={boardT} width={pageW} height={blockT} fill={C.blockFill} stroke={C.block} strokeWidth={sw}
                  opacity={fade(active, ['pageWidth', 'pageHeight', 'blockThickness'])}/>
            <g fill={C.boardFill} stroke={C.board} strokeWidth={sw} opacity={fade(active, ['boardW', 'boardThickness', 'coverMargin'])}>
                <rect x={gutter} y={0} width={boardW} height={boardT}/>
                <rect x={gutter} y={H - boardT} width={boardW} height={boardT}/>
            </g>
            <rect x={0} y={0} width={boardT} height={H} fill={C.spineFill} stroke={C.spine} strokeWidth={sw}
                  opacity={fade(active, ['spine', 'boardThickness'])}/>
            {active === 'coverMargin' && (
                <g fill={C.overhang} fillOpacity="0.3">
                    <rect x={boardT + pageW} y={0} width={coverMargin} height={boardT}/>
                    <rect x={boardT + pageW} y={H - boardT} width={coverMargin} height={boardT}/>
                </g>
            )}
            <path d={fabricPath} fill="none" stroke={C.fabric} strokeWidth={sw * (active === 'fabricMargin' ? 2.5 : 1.2)}
                  strokeLinejoin="round" opacity={fade(active, ['fabricMargin', 'fabric'])}/>

            <Dim {...dimProps} keys={['spine']} color={C.spine} x1={-fs * 1.6} y1={0} x2={-fs * 1.6} y2={H} label="s" lx={-fs * 2.3} ly={H / 2}/>
            <Dim {...dimProps} keys={['boardW']} color={C.board} x1={gutter} y1={-fs * 1.3} x2={W} y2={-fs * 1.3} label="board w" lx={gutter + boardW / 2} ly={-fs * 2}/>
            <Dim {...dimProps} keys={['pageWidth']} color={C.block} x1={boardT} y1={boardT + blockT / 2} x2={boardT + pageW} y2={boardT + blockT / 2}
                 label="text block width" lx={boardT + pageW / 2} ly={boardT + blockT / 2 - fs * 0.7}/>
            <Dim {...dimProps} keys={['blockThickness']} color={C.block} x1={W + fs * 1.3} y1={boardT} x2={W + fs * 1.3} y2={H - boardT}
                 label="thickness" lx={W + fs * 1.9} ly={H / 2} anchor="start"/>
            <Dim {...dimProps} keys={['boardThickness']} color={C.board} x1={W + fs * 1.3} y1={H - boardT} x2={W + fs * 1.3} y2={H}
                 label="board" lx={W + fs * 1.9} ly={H + fs * 0.4} anchor="start"/>
            <Dim {...dimProps} keys={['gutter']} color={C.gutter} x1={0} y1={H + fs * 1.4} x2={gutter} y2={H + fs * 1.4} label="g" lx={gutter / 2} ly={H + fs * 2.3}/>
            <Dim {...dimProps} keys={['coverMargin']} color={C.overhang} x1={boardT + pageW} y1={H + fs * 1.4} x2={W} y2={H + fs * 1.4}
                 label="overhang" lx={W} ly={H + fs * 2.3} anchor="end"/>
        </svg>
    );
};

// --- Cover laid flat, inside view ---
const FlatLayoutSVG = ({ d, active }) => {
    const { boardW, boardH, spineW, gutter, fabricMargin: fm, coverMargin: cm, pageH, fabricW, fabricH } = d;
    const fs = fabricW / 36;
    const lx = fm, sx = fm + boardW + gutter, rx = sx + spineW + gutter, y0 = fm;
    const sw = fs * 0.1;
    const dimProps = { active, fs };
    return (
        <svg viewBox={`${-fs * 5} ${-fs} ${fabricW + fs * 10} ${fabricH + fs * 2}`} className="w-full max-h-[460px]" role="img" aria-label="Flat cover layout">
            <path d={fabricOutlinePath(d)} fill={C.fabricFill} stroke={C.fabric} strokeWidth={sw * (active === 'fabricMargin' || active === 'fabric' ? 2.5 : 1.2)}
                  opacity={fade(active, ['fabricMargin', 'fabric'])}/>
            <g fill={C.boardFill} stroke={C.board} strokeWidth={sw} opacity={fade(active, ['boardW', 'boardThickness', 'coverMargin', 'pageHeight'])}>
                <rect x={lx} y={y0} width={boardW} height={boardH}/>
                <rect x={rx} y={y0} width={boardW} height={boardH}/>
            </g>
            <rect x={sx} y={y0} width={spineW} height={boardH} fill={C.spineFill} stroke={C.spine} strokeWidth={sw}
                  opacity={fade(active, ['spine', 'boardThickness'])}/>
            {/* Where the pages sit once the book is closed */}
            <rect x={rx} y={y0 + cm} width={Math.max(0, boardW - cm)} height={pageH} fill={C.blockFill} fillOpacity="0.6"
                  stroke={C.block} strokeWidth={sw} strokeDasharray={`${fs * 0.5} ${fs * 0.3}`}
                  opacity={fade(active, ['pageHeight', 'pageWidth', 'coverMargin'])}/>

            {active === 'coverMargin' && (
                <path d={`${rectPath(rx, y0, boardW, boardH)} ${rectPath(rx, y0 + cm, boardW - cm, pageH)}`}
                      fill={C.overhang} fillOpacity="0.35" fillRule="evenodd"/>
            )}

            <Dim {...dimProps} keys={['boardW']} color={C.board} x1={lx} y1={y0 + boardH * 0.2} x2={lx + boardW} y2={y0 + boardH * 0.2}
                 label="board w" lx={lx + boardW / 2} ly={y0 + boardH * 0.2 - fs * 0.8}/>
            <Dim {...dimProps} keys={['boardW']} color={C.board} x1={lx + boardW * 0.2} y1={y0} x2={lx + boardW * 0.2} y2={y0 + boardH}
                 label="board h" lx={lx + boardW * 0.2 + fs * 0.5} ly={y0 + boardH * 0.6} anchor="start"/>
            <Dim {...dimProps} keys={['spine']} color={C.spine} x1={sx} y1={y0 + boardH / 2} x2={sx + spineW} y2={y0 + boardH / 2}
                 label="s" lx={sx + spineW / 2} ly={y0 + boardH / 2 - fs * 0.9}/>
            {[lx + boardW, sx + spineW].map(x => (
                <Dim key={x} {...dimProps} keys={['gutter']} color={C.gutter} x1={x} y1={y0 + boardH + fm * 0.45} x2={x + gutter} y2={y0 + boardH + fm * 0.45}
                     label="g" lx={x + gutter / 2} ly={y0 + boardH + fm * 0.45 - fs * 0.8}/>
            ))}
            <Dim {...dimProps} keys={['pageHeight']} color={C.block} x1={rx + (boardW - cm) / 2} y1={y0 + cm} x2={rx + (boardW - cm) / 2} y2={y0 + cm + pageH}
                 label="page h" lx={rx + (boardW - cm) / 2 + fs * 0.5} ly={y0 + boardH * 0.4} anchor="start"/>
            <Dim {...dimProps} keys={['coverMargin']} color={C.overhang} x1={rx + boardW - cm} y1={y0 + boardH * 0.75} x2={rx + boardW} y2={y0 + boardH * 0.75}
                 label="overhang" lx={rx + boardW + fs * 0.6} ly={y0 + boardH * 0.75} anchor="start"/>
            <Dim {...dimProps} keys={['fabricMargin']} color={C.fabric} x1={0} y1={y0 + boardH / 2} x2={fm} y2={y0 + boardH / 2}
                 label="turn-in" lx={-fs * 0.4} ly={y0 + boardH / 2} anchor="end"/>
        </svg>
    );
};

// --- Laser Cut Export ---
// Units are millimetres (width/height in mm, viewBox 1 unit = 1 mm) so files import at true scale.
// Red = cut, blue = score; score lines come first so they run before pieces are cut free.
const LASER_CUT = '#FF0000';
const LASER_SCORE = '#0000FF';

const rectPath = (x, y, w, h) => {
    const f = n => +n.toFixed(3);
    return `M ${f(x)} ${f(y)} H ${f(x + w)} V ${f(y + h)} H ${f(x)} Z`;
};

const buildLaserSvg = ({ width, height, cuts, scores = [] }, strokeWidth = 0.1) => {
    const paths = (list) => list.map(d => `    <path d="${d}"/>`).join('\n');
    const w = +width.toFixed(3), h = +height.toFixed(3);
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">`,
        scores.length ? `  <g id="score" fill="none" stroke="${LASER_SCORE}" stroke-width="${strokeWidth}">\n${paths(scores)}\n  </g>` : '',
        `  <g id="cut" fill="none" stroke="${LASER_CUT}" stroke-width="${strokeWidth}">\n${paths(cuts)}\n  </g>`,
        '</svg>',
    ].filter(Boolean).join('\n');
};

const buildLaserSheets = (dims, { spacing, guides }) => {
    const { boardW, boardH, spineW, gutter, fabricMargin, fabricW, fabricH } = dims;

    // Boards: front cover, spine, back cover in a row, `spacing` apart.
    const spineX = spacing + boardW + spacing;
    const backX = spineX + spineW + spacing;
    const boards = {
        width: backX + boardW + spacing,
        height: boardH + 2 * spacing,
        cuts: [
            rectPath(spacing, spacing, boardW, boardH),
            rectPath(spineX, spacing, spineW, boardH),
            rectPath(backX, spacing, boardW, boardH),
        ],
    };

    // Fabric: mitered outline, optional board placement guides matching the flat layout.
    const fx = spacing + fabricMargin, fy = spacing + fabricMargin;
    const fabric = {
        width: fabricW + 2 * spacing,
        height: fabricH + 2 * spacing,
        cuts: [fabricOutlinePath(dims, spacing, spacing)],
        scores: guides ? [
            rectPath(fx, fy, boardW, boardH),
            rectPath(fx + boardW + gutter, fy, spineW, boardH),
            rectPath(fx + boardW + gutter + spineW + gutter, fy, boardW, boardH),
        ] : [],
    };

    return { boards, fabric };
};

const downloadSvg = (svg, filename) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// --- UI Pieces ---
const mm = n => n.toFixed(1);

const Step = ({ n, title, subtitle, id, children }) => (
    <section id={id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 scroll-mt-4">
        <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-semibold flex items-center justify-center">{n}</span>
            <div>
                <h2 className="text-lg font-semibold text-slate-800 leading-7">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
        </div>
        {children}
    </section>
);

const Field = ({ k, label, term, hint, color, value, onChange, onFocusKey, onHoverKey }) => (
    <div onMouseEnter={() => onHoverKey(k)} onMouseLeave={() => onHoverKey(null)}>
        <label htmlFor={k} className="flex items-baseline gap-2 text-sm font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 self-center" style={{ background: color }}></span>
            {label}
            {term && <span className="text-xs font-normal text-slate-400">{term}</span>}
        </label>
        <div className="mt-1 flex items-center rounded-md border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-400">
            <input
                id={k} type="number" inputMode="decimal" min="0" step="0.1"
                value={value}
                onChange={e => onChange(k, e.target.value)}
                onFocus={() => onFocusKey(k)}
                onBlur={() => onFocusKey(null)}
                className="w-full p-2 rounded-l-md bg-transparent outline-none"
            />
            <span className="px-3 text-sm text-slate-400">mm</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
);

const LaserSheetCard = ({ title, sheet, filename, primary, children }) => (
    <div className="flex flex-col border border-slate-200 rounded-lg p-3">
        <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-semibold text-slate-700">{title}</h3>
            <span className="text-xs text-slate-500">sheet {mm(sheet.width)} × {mm(sheet.height)} mm</span>
        </div>
        <div className="flex items-center justify-center bg-slate-50 rounded p-2 h-44">
            {/* Preview uses a heavier stroke so hairlines stay visible when scaled down */}
            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildLaserSvg(sheet, 1))}`} alt={`${title} preview`} className="max-w-full max-h-full object-contain"/>
        </div>
        <div className="text-xs text-slate-600 mt-2 space-y-0.5 flex-grow">{children}</div>
        <button
            type="button"
            onClick={() => downloadSvg(buildLaserSvg(sheet), filename)}
            className={`mt-3 w-full py-2.5 rounded-md text-sm font-semibold transition-colors ${primary ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
        >
            Download {title.toLowerCase()} SVG
        </button>
    </div>
);

const LaserCutPanel = ({ dims }) => {
    const [spacing, setSpacing] = React.useState(5);
    const [guides, setGuides] = React.useState(false);
    const { boards, fabric } = buildLaserSheets(dims, { spacing: Math.max(0, spacing), guides });

    return (
        <div>
            <ol className="text-sm text-slate-600 space-y-1 mb-4 list-decimal list-inside">
                <li>Download the <strong>boards</strong> file and cut it from board stock that is <strong>{dims.boardT} mm</strong> thick.</li>
                <li>Import at <strong>100% / 1:1 scale</strong>; the file is in millimetres.</li>
                <li><span className="font-semibold" style={{ color: LASER_CUT }}>Red</span> lines are cuts{guides && <>, <span className="font-semibold" style={{ color: LASER_SCORE }}>blue</span> lines are light scores</>}. Check the sheet size fits your laser bed.</li>
                <li>Cutting cloth on the laser too? Use the <strong>fabric</strong> file, or print it as a template to cut by hand.</li>
            </ol>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LaserSheetCard title="Boards" primary sheet={boards} filename={`boards_${mm(dims.boardW)}x${mm(dims.boardH)}mm.svg`}>
                    <p>2 × cover board, {mm(dims.boardW)} × {mm(dims.boardH)} mm</p>
                    <p>1 × spine, {mm(dims.spineW)} × {mm(dims.boardH)} mm</p>
                </LaserSheetCard>
                <LaserSheetCard title="Fabric" sheet={fabric} filename={`fabric_${mm(dims.fabricW)}x${mm(dims.fabricH)}mm.svg`}>
                    <p>1 × cover cloth, {mm(dims.fabricW)} × {mm(dims.fabricH)} mm, corners cut</p>
                    <p>{guides ? 'Includes board placement guides (blue): score at low power on the back side.' : 'Outline only.'}</p>
                </LaserSheetCard>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                    Gap between pieces
                    <input type="number" min="0" value={spacing} onChange={e => setSpacing(parseFloat(e.target.value) || 0)} className="w-16 p-1.5 border border-slate-300 rounded-md"/>
                    mm
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={guides} onChange={e => setGuides(e.target.checked)}/>
                    Add board placement guides to the fabric file
                </label>
            </div>
        </div>
    );
};

// --- Main App Component ---
const FIELDS = {
    block: [
        { k: 'pageWidth', label: 'Width', hint: 'From the spine edge to the front edge of the pages.', color: C.block },
        { k: 'pageHeight', label: 'Height', hint: 'From the top of the pages to the bottom.', color: C.block },
        { k: 'blockThickness', label: 'Thickness', hint: 'Across the spine, with the pages pressed flat.', color: C.block },
    ],
    materials: [
        { k: 'boardThickness', label: 'Board thickness', hint: 'Measure your greyboard or chipboard, ideally with calipers.', color: C.board },
        { k: 'coverMargin', label: 'Overhang', term: 'cover margin', hint: 'How far the cover sticks out past the pages at the top, bottom and front. 3 mm is typical.', color: C.overhang },
        { k: 'fabricMargin', label: 'Turn-in', term: 'fabric margin', hint: 'Extra cloth around the boards that folds over to the inside. 15–20 mm is typical.', color: C.fabric },
    ],
};

const App = () => {
    const [inputs, setInputs] = React.useState({
        pageWidth: '150', pageHeight: '230', blockThickness: '20',
        boardThickness: '2.5', coverMargin: '3', fabricMargin: '20',
    });
    const [focusKey, setFocusKey] = React.useState(null);
    const [hoverKey, setHoverKey] = React.useState(null);
    const active = hoverKey || focusKey;

    // Keep raw strings so values like "2." can be typed; parse for the maths.
    const num = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, Math.max(0, parseFloat(v) || 0)]));
    const d = computeDims(num);
    const onChange = (k, v) => setInputs(prev => ({ ...prev, [k]: v }));

    const valid = d.pageW > 0 && d.pageH > 0 && d.blockT > 0 && d.boardT > 0 && d.boardW > 0;
    const warnings = [];
    if (!valid) warnings.push('Fill in every measurement above zero to see your cover.');
    else if (d.fabricMargin <= d.boardT) warnings.push('The turn-in is smaller than the board thickness, so the cloth won\'t reach the inside of the boards.');

    const fieldProps = { onChange, onFocusKey: setFocusKey, onHoverKey: setHoverKey };
    const cutList = [
        { key: 'boardW', color: C.board, name: 'Cover boards', qty: 2, size: `${mm(d.boardW)} × ${mm(d.boardH)} mm`, from: 'board' },
        { key: 'spine', color: C.spine, name: 'Spine board', qty: 1, size: `${mm(d.spineW)} × ${mm(d.boardH)} mm`, from: 'board' },
        { key: 'fabric', color: C.fabric, name: 'Cover cloth', qty: 1, size: `${mm(d.fabricW)} × ${mm(d.fabricH)} mm`, from: 'cloth' },
        { key: 'gutter', color: C.gutter, name: 'Hinge gap (g)', qty: null, size: `${mm(d.gutter)} mm`, from: 'leave between spine and each board when gluing' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Book Cover Calculator</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Measure your pages, enter your materials, then download cut files for the laser.
                        Hover or click any measurement to see where it goes on the diagrams.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,360px)_1fr] gap-4 items-start">
                    {/* Inputs stay in view while scrolling to the downloads */}
                    <div className="space-y-4 lg:sticky lg:top-4">
                        <Step n="1" title="Measure your text block" subtitle="The stack of sewn or glued pages, before it has a cover.">
                            <div className="space-y-4">
                                {FIELDS.block.map(f => <Field key={f.k} {...f} {...fieldProps} value={inputs[f.k]}/>)}
                            </div>
                        </Step>
                        <Step n="2" title="Your materials">
                            <div className="space-y-4">
                                {FIELDS.materials.map(f => <Field key={f.k} {...f} {...fieldProps} value={inputs[f.k]}/>)}
                            </div>
                        </Step>
                    </div>

                    <div className="space-y-4 min-w-0">
                        <Step n="3" title="Check your cover" subtitle="Both drawings update as you type and are drawn to scale.">
                            {warnings.map(w => <p key={w} className="mb-3 text-sm rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">{w}</p>)}
                            {valid && <>
                                <div className="space-y-4">
                                    <figure>
                                        <figcaption className="text-sm font-medium text-slate-600 mb-1">Closed book, seen from the top</figcaption>
                                        <div className="bg-slate-50 rounded-lg p-2"><CrossSectionSVG d={d} active={active}/></div>
                                    </figure>
                                    <figure>
                                        <figcaption className="text-sm font-medium text-slate-600 mb-1">Cover laid flat, inside facing up</figcaption>
                                        <div className="bg-slate-50 rounded-lg p-2 flex justify-center"><FlatLayoutSVG d={d} active={active}/></div>
                                    </figure>
                                </div>

                                <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Cut list</h3>
                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg text-sm">
                                    {cutList.map(r => (
                                        <div key={r.key} onMouseEnter={() => setHoverKey(r.key)} onMouseLeave={() => setHoverKey(null)}
                                             className={`flex flex-wrap items-baseline gap-x-3 px-3 py-2 transition-colors ${active === r.key ? 'bg-slate-50' : ''}`}>
                                            <span className="w-2.5 h-2.5 rounded-full self-center" style={{ background: r.color }}></span>
                                            <span className="font-medium text-slate-800 min-w-[9rem]">{r.qty ? `${r.qty} × ` : ''}{r.name}</span>
                                            <span className="font-mono text-slate-800">{r.size}</span>
                                            <span className="text-slate-500 text-xs">{r.qty ? `from ${r.from}` : r.from}</span>
                                        </div>
                                    ))}
                                </div>

                                <details className="mt-3 text-sm text-slate-600">
                                    <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Show the math</summary>
                                    <div className="mt-2 grid sm:grid-cols-2 gap-2 font-mono text-xs">
                                        <p className="bg-slate-50 rounded p-2">board w = width − thickness/2 + overhang<br/>= {d.pageW} − {d.blockT}/2 + {d.coverMargin} = <strong>{mm(d.boardW)}</strong></p>
                                        <p className="bg-slate-50 rounded p-2">board h = height + 2 × overhang<br/>= {d.pageH} + 2×{d.coverMargin} = <strong>{mm(d.boardH)}</strong></p>
                                        <p className="bg-slate-50 rounded p-2">s = thickness + 2 × board<br/>= {d.blockT} + 2×{d.boardT} = <strong>{mm(d.spineW)}</strong></p>
                                        <p className="bg-slate-50 rounded p-2">g = thickness/2 + board<br/>= {d.blockT}/2 + {d.boardT} = <strong>{mm(d.gutter)}</strong></p>
                                        <p className="bg-slate-50 rounded p-2 sm:col-span-2">cloth w = 2 × board w + s + 2 × g + 2 × turn-in<br/>= 2×{mm(d.boardW)} + {mm(d.spineW)} + 2×{mm(d.gutter)} + 2×{d.fabricMargin} = <strong>{mm(d.fabricW)}</strong></p>
                                    </div>
                                </details>
                                <details className="mt-2 text-sm text-slate-600">
                                    <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Reference drawing: how the cover opens and closes</summary>
                                    <img src="Fold diagram.png" alt="Hand-drawn cross-sections of the book closed, half open and fully open" className="mt-2 max-w-full mx-auto"/>
                                </details>
                            </>}
                        </Step>

                        <Step n="4" id="laser-cut" title="Cut on the laser" subtitle="Files are generated from the measurements above.">
                            {valid ? <LaserCutPanel dims={d}/> : <p className="text-sm text-slate-500">Finish steps 1 and 2 to generate cut files.</p>}
                        </Step>
                    </div>
                </div>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
