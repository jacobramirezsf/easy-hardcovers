// --- Helper Components ---
const InputField = ({ id, label, value, onChange, colorClass }) => (
    <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`}></span>
        <label htmlFor={id} className="flex-shrink-0 w-32 text-sm font-medium text-slate-600">{label}</label>
        <input
            type="number"
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            className="w-full p-2 border border-slate-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
        />
    </div>
);

// --- Shared Geometry ---
// Fabric outline with 45° corner cuts that sit one board thickness away from each board corner.
const fabricOutlinePath = (dims, x0 = 0, y0 = 0) => {
    const c = Math.max(0, 2 * dims.fabricMargin - dims.boardT * Math.sqrt(2));
    const w = dims.fabricW, h = dims.fabricH;
    const pts = [[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]];
    return 'M ' + pts.map(([x, y]) => `${+(x0 + x).toFixed(3)} ${+(y0 + y).toFixed(3)}`).join(' L ') + ' Z';
};

// --- SVG Preview Component ---
const FlatLayoutSVG = ({ dims }) => {
    if (dims.fabricW <= 0 || dims.fabricH <= 0) return null;

    // --- Key Coordinates ---
    const leftBoardX = dims.fabricMargin;
    const rightBoardX = dims.fabricMargin + dims.boardW + dims.gutter + dims.spineW + dims.gutter;
    const spineX = dims.fabricMargin + dims.boardW + dims.gutter;

    const pageLeftX = dims.fabricMargin + dims.coverMargin;
    const pageRightX = rightBoardX;
    const pageTopY = dims.fabricMargin + dims.coverMargin;

    return (
        <svg viewBox={`-60 -40 ${dims.fabricW + 120} ${dims.fabricH + 80}`} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>{`.label{font:500 12px 'Inter',sans-serif;text-anchor:middle;stroke:none}.label-sm{font:400 10px 'Inter',sans-serif;text-anchor:middle;stroke:none}`}</style>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker>
            </defs>

            {/* --- Fabric Outline (Red) --- */}
            {/* --- Fabric Outline with Corner Cuts --- */}
            <path d={fabricOutlinePath(dims)} fill="#f4a9a8" className="stroke-page-block" strokeWidth="1.5"/>

            {/* --- Cover Boards --- */}
            <g className="stroke-board-item" strokeWidth="1.5" fill="none" stroke="#22c55e">
                {/* Left Board */}
                <rect x={leftBoardX} y={dims.fabricMargin} width={dims.boardW} height={dims.boardH} rx="2" ry="2"/>
                {/* Right Board */}
                <rect x={rightBoardX} y={dims.fabricMargin} width={dims.boardW} height={dims.boardH} rx="2" ry="2"/>
            </g>

            {/* --- Spine Board Fill (Light yellow) --- */}
            <rect x={spineX + dims.boardT} y={dims.fabricMargin + dims.coverMargin} width={dims.spineW - 2 * dims.boardT} height={dims.boardH - 2 * dims.coverMargin} className="fill-calculated-light"/>
            {/* --- Spine Board Outline (Yellow) --- */}
            <rect x={spineX} y={dims.fabricMargin} width={dims.spineW} height={dims.boardH} fill="none" stroke="#eab308" strokeWidth="1.5" />
            

            {/* --- Page Blocks (Light Gray) --- */}
            <rect x={pageLeftX} y={pageTopY} width={dims.pageW-dims.blockT/2} height={dims.pageH} className="fill-page-light"/>
            <rect x={pageRightX} y={pageTopY} width={dims.pageW-dims.blockT/2} height={dims.pageH} className="fill-page-light"/>

            {/* --- Page Dimensions --- */}
            <g className="stroke-page-block fill-page-block">
                {/* Page Height (h) */}
                <line x1={pageLeftX + dims.pageW/2} y1={pageTopY} x2={pageLeftX + dims.pageW/2} y2={pageTopY + dims.pageH} markerStart="url(#arrow)" markerEnd="url(#arrow)"/>
                <text x={pageLeftX + dims.pageW/2 + 10} y={pageTopY + dims.pageH/2} className="label text-page-block" transform={`rotate(-90, ${pageLeftX + dims.pageW/2}, ${pageTopY + dims.pageH/2})`}>h</text>

                {/* Page Width (w) */}
                <line x1={pageRightX} y1={pageTopY + dims.pageH/2} x2={pageRightX + dims.pageW} y2={pageTopY + dims.pageH/2} markerStart="url(#arrow)" markerEnd="url(#arrow)"/>
                <text x={pageRightX + dims.pageW/2} y={pageTopY + dims.pageH/2 - 8} className="label text-page-block">w</text>
            </g>

            {/* --- Margin Dimensions --- */}
            <g className="stroke-margin-item fill-margin-item">
                {/* Cover Margin */}
                <line x1={-5} y1={dims.fabricMargin + dims.boardH/2} x2={leftBoardX} y2={dims.fabricMargin + dims.boardH/2} markerEnd="url(#arrow)"/>
                <text x="-20" y={dims.fabricMargin + dims.boardH/2 + 4} className="label-sm text-margin-item">
                    cover<tspan x="-20" dy="1.2em">margin</tspan>
                </text>

                {/* Fabric Margin */}
                <line x1={dims.fabricW - dims.fabricMargin - dims.boardW/2} y1={dims.fabricMargin + dims.boardH + 5} x2={dims.fabricW - dims.fabricMargin - dims.boardW/2} y2={dims.fabricH} markerEnd="url(#arrow)"/>
                <text x={dims.fabricW - dims.fabricMargin - dims.boardW/2} y={dims.fabricH + 15} className="label-sm text-margin-item">fabric margin</text>
            </g>

            {/* --- Calculated Dimensions --- */}
            <g className="stroke-calculated-item fill-calculated-item">
                {/* Hinge Gutter (g) */}
                <line x1={dims.fabricMargin + dims.boardW} y1={dims.fabricMargin + dims.boardH + 5} x2={dims.fabricMargin + dims.boardW + dims.gutter} y2={dims.fabricMargin + dims.boardH + 5} markerStart="url(#arrow)" markerEnd="url(#arrow)"/><text x={dims.fabricMargin + dims.boardW + dims.gutter / 2} y={dims.fabricMargin + dims.boardH + 18} className="label text-calculated-item">g</text>

                {/* Spine Width (s) */}
                <line x1={spineX} y1={dims.fabricMargin + dims.boardH/2} x2={spineX + dims.spineW} y2={dims.fabricMargin + dims.boardH/2} markerStart="url(#arrow)" markerEnd="url(#arrow)"/>
                <text x={spineX + dims.spineW / 2} y={dims.fabricMargin + dims.boardH/2 - 8} className="label text-calculated-item">s</text>
            </g>

            {/* --- Board Thickness Label --- */}
            <g className="stroke-board-item fill-board-item">
                <line x1={dims.fabricW - dims.fabricMargin} y1={dims.fabricH - dims.fabricMargin} x2={dims.fabricW - dims.fabricMargin + dims.boardT} y2={dims.fabricH - dims.fabricMargin + dims.boardT}/><text x={dims.fabricW - dims.fabricMargin + dims.boardT + 8} y={dims.fabricH - dims.fabricMargin + dims.boardT + 20} className="label-sm text-board-item" textAnchor="start">board th</text>
            </g>
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

const LaserSheetCard = ({ title, sheet, filename, children }) => (
    <div className="flex flex-col border border-slate-200 rounded-lg p-3">
        <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-semibold text-slate-700">{title}</h3>
            <span className="text-xs text-slate-500">{sheet.width.toFixed(1)} × {sheet.height.toFixed(1)} mm</span>
        </div>
        <div className="flex-grow flex items-center justify-center bg-slate-50 rounded p-2 h-48">
            {/* Preview uses a heavier stroke so hairlines stay visible when scaled down */}
            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildLaserSvg(sheet, 1))}`} alt={`${title} preview`} className="max-w-full max-h-full object-contain"/>
        </div>
        <div className="text-xs text-slate-600 mt-2 space-y-0.5">{children}</div>
        <button
            type="button"
            onClick={() => downloadSvg(buildLaserSvg(sheet), filename)}
            className="mt-3 w-full py-2 rounded-md bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
        >
            Download SVG
        </button>
    </div>
);

const LaserCutPanel = ({ dims }) => {
    const [spacing, setSpacing] = React.useState(5);
    const [guides, setGuides] = React.useState(false);

    const valid = [dims.boardW, dims.boardH, dims.spineW, dims.fabricW, dims.fabricH].every(n => n > 0);
    if (!valid) {
        return <p className="text-sm text-slate-500">Enter positive dimensions to generate laser cut files.</p>;
    }

    const { boards, fabric } = buildLaserSheets(dims, { spacing: Math.max(0, spacing), guides });
    const mm = n => n.toFixed(1);

    return (
        <div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                    Spacing between pieces:
                    <input type="number" min="0" value={spacing} onChange={e => setSpacing(parseFloat(e.target.value) || 0)} className="w-20 p-1.5 border border-slate-200 rounded-md"/>
                    mm
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={guides} onChange={e => setGuides(e.target.checked)}/>
                    Score board placement guides on fabric
                </label>
                <span className="text-xs text-slate-500">
                    <span style={{ color: LASER_CUT }}>■</span> cut &nbsp; <span style={{ color: LASER_SCORE }}>■</span> score · 1 unit = 1 mm
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LaserSheetCard title="Boards" sheet={boards} filename={`boards_${mm(dims.boardW)}x${mm(dims.boardH)}mm.svg`}>
                    <p>2 × cover board: {mm(dims.boardW)} × {mm(dims.boardH)} mm</p>
                    <p>1 × spine: {mm(dims.spineW)} × {mm(dims.boardH)} mm</p>
                </LaserSheetCard>
                <LaserSheetCard title="Fabric" sheet={fabric} filename={`fabric_${mm(dims.fabricW)}x${mm(dims.fabricH)}mm.svg`}>
                    <p>1 × cover fabric: {mm(dims.fabricW)} × {mm(dims.fabricH)} mm, mitered corners</p>
                    <p>{guides ? 'Placement guides included (blue): score at low power on the back side.' : 'Outline only.'}</p>
                </LaserSheetCard>
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [inputs, setInputs] = React.useState({
        pageWidth: 150,
        pageHeight: 230,
        blockThickness: 20,
        boardThickness: 2.5,
        coverMargin: 3,
        fabricMargin: 20,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const pageW = inputs.pageWidth;
    const pageH = inputs.pageHeight;
    const blockT = inputs.blockThickness;
    const boardT = inputs.boardThickness;
    const coverMargin = inputs.coverMargin;
    const fabricMargin = inputs.fabricMargin;

    const boardW = pageW - (0.5 * blockT) + coverMargin;
    const boardH = pageH + (2 * coverMargin);
    const spineW = blockT + (2 * boardT);
    const gutter = (blockT / 2) + boardT;
    const fabricW = (2 * boardW) + spineW + (2 * gutter) + (2 * fabricMargin);
    const fabricH = boardH + (2 * fabricMargin);

    const dims = { pageW, pageH, blockT, boardW, boardH, boardT, spineW, gutter, fabricMargin, fabricW, fabricH, coverMargin };

    return (
        <div className="min-h-screen bg-slate-50 p-2 sm:p-4">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-500">
                        Book Cover Calculator
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">Visual tool for crafting the perfect book cover</p>
                </header>

                {/* Main Layout - Diagrams First, Then Controls */}
                <div className="grid grid-cols-1 gap-3 h-[calc(100vh-110px)]">
                    
                    {/* Top Row: Both Diagrams Side by Side - Most Prominent */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-3/5">
                        
                        {/* Folded Reference Diagram - First */}
                        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col">
                            <h3 className="text-center font-semibold text-slate-700 mb-3 text-lg">Cross-Sectional Diagram</h3>
                            <div className="flex-grow flex items-center justify-center min-h-0">
                                <img src="Fold diagram.png" alt="Folded book cross-section diagram" className="max-w-full max-h-full object-contain"/>
                            </div>
                        </div>

                        {/* Live Flat Layout - Second */}
                        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col">
                            <h3 className="text-center font-semibold text-slate-700 mb-3 text-lg">Live Updating Flat Layout</h3>
                            <div className="flex-grow min-h-0">
                                <FlatLayoutSVG dims={dims} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Controls, Results, and Formulas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 h-2/5">
                        
                        {/* Page Block Controls */}
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <h2 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">Page Block</h2>
                            <div className="space-y-3">
                                <InputField id="pageWidth" label="Width:" value={inputs.pageWidth} onChange={handleInputChange} colorClass="color-page-block" />
                                <InputField id="pageHeight" label="Height:" value={inputs.pageHeight} onChange={handleInputChange} colorClass="color-page-block" />
                                <InputField id="blockThickness" label="Thickness:" value={inputs.blockThickness} onChange={handleInputChange} colorClass="color-page-block" />
                            </div>
                        </div>
                        
                        {/* Materials Controls */}
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <h2 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">Materials</h2>
                            <div className="space-y-3">
                                <InputField id="boardThickness" label="Board Thick:" value={inputs.boardThickness} onChange={handleInputChange} colorClass="color-board-item" />
                                <InputField id="coverMargin" label="Cover Margin:" value={inputs.coverMargin} onChange={handleInputChange} colorClass="color-margin-item" />
                                <InputField id="fabricMargin" label="Fabric Margin:" value={inputs.fabricMargin} onChange={handleInputChange} colorClass="color-margin-item" />
                            </div>
                        </div>

                        {/* Final Dimensions Results */}
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <h2 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">Final Dimensions</h2>
                            <div className="space-y-2 text-sm text-slate-700">
                                <p><strong className="text-board-item">Cover Board:</strong> {boardW.toFixed(1)} × {boardH.toFixed(1)} mm</p>
                                <p><strong className="text-calculated-item">Spine (s):</strong> {spineW.toFixed(1)} mm</p>
                                <p><strong className="text-calculated-item">Gutter (g):</strong> {gutter.toFixed(1)} mm</p>
                                <hr className="my-2 border-slate-200" />
                                <p className="font-semibold"><strong>Total Fabric:</strong> {fabricW.toFixed(1)} × {fabricH.toFixed(1)} mm</p>
                            </div>
                        </div>

                        {/* Key Formulas - Compact */}
                        <div className="bg-white rounded-lg shadow-sm p-4 overflow-y-auto">
                            <h2 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">Key Formulas</h2>
                            <div className="space-y-2 text-xs">
                                <div className="bg-slate-50 p-2 rounded">
                                    <strong className="text-board-item">Board Width:</strong><br/>
                                    {pageW.toFixed(1)} - 0.5×{blockT.toFixed(1)} + {coverMargin.toFixed(1)} = <strong>{boardW.toFixed(1)}</strong>
                                </div>
                                <div className="bg-slate-50 p-2 rounded">
                                    <strong className="text-calculated-item">Spine:</strong><br/>
                                    {blockT.toFixed(1)} + 2×{boardT.toFixed(1)} = <strong>{spineW.toFixed(1)}</strong>
                                </div>
                                <div className="bg-slate-50 p-2 rounded">
                                    <strong className="text-calculated-item">Gutter:</strong><br/>
                                    {blockT.toFixed(1)}/2 + {boardT.toFixed(1)} = <strong>{gutter.toFixed(1)}</strong>
                                </div>
                                <div className="bg-slate-50 p-2 rounded">
                                    <strong>Fabric Width:</strong><br/>
                                    2×{boardW.toFixed(1)} + {spineW.toFixed(1)} + 2×{gutter.toFixed(1)} + 2×{fabricMargin.toFixed(1)} = <strong>{fabricW.toFixed(1)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Laser Cut Export */}
                <div className="bg-white rounded-lg shadow-sm p-4 mt-3">
                    <h2 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">Laser Cut Files</h2>
                    <LaserCutPanel dims={dims} />
                </div>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
