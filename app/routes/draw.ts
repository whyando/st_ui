
import { ship_model, ship_symbol_base10 } from "~/ship_utils";

const is_market = (waypoint: any) => waypoint.traits.some((trait: any) => trait.symbol === 'MARKETPLACE');

export default function draw(ctx, renderInfo, height: number, width: number, waypoints: any[], ships: any[], filters: {}) {
    if (waypoints.length === 0) {
        return;
    }
    const { zoom, pan } = renderInfo;

    // black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // const waypoints_filtered = waypoints.filter(waypoint => waypoint.traits.some((trait: any) => trait.symbol === 'MARKETPLACE'));
    const waypoints_filtered = waypoints
    const system_symbol = waypoints[0].systemSymbol

    let xMax = -Infinity;
    let yMax = -Infinity;
    let xMin = Infinity;
    let yMin = Infinity;
    for (let waypoint of waypoints_filtered) {
        xMax = Math.max(xMax, waypoint.x);
        yMax = Math.max(yMax, waypoint.y);
        xMin = Math.min(xMin, waypoint.x);
        yMin = Math.min(yMin, waypoint.y);
    }
    let xCenter = (xMax + xMin) / 2;
    let yCenter = (yMax + yMin) / 2;

    // transform from [(xMin, yMin), (xMax, yMax)] to [(padding, padding), (width-padding, height-padding)]
    // but keep the aspect ratio the same
    const padding = 40;
    const xScale = (width - 2 * padding) / (xMax - xMin);
    const yScale = (height - 2 * padding) / (yMax - yMin);
    const scale = Math.min(xScale, yScale) * zoom;
    const transform = (x: number, y: number) => {
        const x0 = (x - xCenter) * scale + width / 2 + pan.x;
        const y0 = (y - yCenter) * scale + height / 2 + pan.y;
        return [x0, y0];
    };
    const invTransform = (x: number, y: number) => {
        const x0 = (x - width / 2 - pan.x) / scale + xCenter;
        const y0 = (y - height / 2 - pan.y) / scale + yCenter;
        return [x0, y0];
    }

    // // grid lines
    // const gridWidth = 50
    // ctx.strokeStyle = 'gray';
    // ctx.lineWidth = 0.2;
    // ctx.beginPath();
    // const [x0, y0] = invTransform(0, 0);
    // const [x1, y1] = invTransform(width, height);
    // for (let i = gridWidth*Math.floor(x0/gridWidth); i <= Math.ceil(x1); i+=gridWidth) {
    //     const [x, y] = transform(i, 0);
    //     ctx.moveTo(x, 0);
    //     ctx.lineTo(x, height);
    // }
    // for (let i = gridWidth*Math.floor(y0/gridWidth); i <= Math.ceil(y1); i+=gridWidth) {
    //     const [x, y] = transform(0, i);
    //     ctx.moveTo(0, y);
    //     ctx.lineTo(width, y);
    // }
    // ctx.stroke();

    const waypoints_grouped: any = {}
    for (let waypoint of waypoints_filtered) {
        const loc = `${waypoint.x},${waypoint.y}`
        waypoints_grouped[loc] = waypoints_grouped[loc] || []

        const symbol = waypoint.symbol.split('-').pop();
        waypoints_grouped[loc].push({
            symbol: symbol,
            x: waypoint.x,
            y: waypoint.y,
            type: waypoint.type,
            is_market: is_market(waypoint),
        })
    }

    for (let waypoint of Object.values(waypoints_grouped)) {
        let radius = 3;
        if (waypoint.some((w: any) => w.is_market)) {
            ctx.fillStyle = 'orange';
            radius = 3;
        } else {
            ctx.fillStyle = 'white';
            radius = 2;
        }

        ctx.beginPath();
        const [x, y] = transform(waypoint[0].x, waypoint[0].y);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        const symbols = waypoint.map((w: any) => w.symbol).join(' ');
        // maybe only render the text closest to the mouse?
        ctx.fillText(waypoint[0].type, x - 5, y - 2);
        ctx.fillText(symbols, x - 5, y + 8);
        ctx.textAlign = 'left';
    }

    // Ships
    for (let _ship of ships) {
        const ship = _ship.ship;
        const model = ship_model(ship);
        const visible = (model in filters) ? filters[model].visible : true;
        if (!visible || ship.nav.systemSymbol != system_symbol) {
            continue;
        }
        let x,y;
        if (ship.nav.status === 'IN_TRANSIT') {
            const { destination, origin } = ship.nav.route;
            const departureTime = new Date(ship.nav.route.departureTime).getTime();
            const arrivalTime = new Date(ship.nav.route.arrival).getTime();
            let t = (Date.now() - departureTime) / (arrivalTime - departureTime);
            t = Math.min(1, Math.max(0, t));
            const x1 = origin.x + t * (destination.x - origin.x);
            const y1 = origin.y + t * (destination.y - origin.y);
            [x, y] = transform(x1, y1);
        } else {
            const waypointSymbol = ship.nav.waypointSymbol;
            const waypoint = waypoints.find((w) => w.symbol === waypointSymbol);
            [x, y] = transform(waypoint.x, waypoint.y);
        }

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
        ctx.font = '10px monospace';
        ctx.fillText(ship.symbol, x + 5, y - 2);
        ctx.fillText(model, x + 5, y + 8);
        ctx.fillText(ship.nav.status, x + 5, y + 18);
    }
}
