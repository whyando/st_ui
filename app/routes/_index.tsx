import React from "react";
import { useRef } from "react";
import draw from "~/routes/draw";
import { json } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { useSocket } from "~/context";


function resizeCanvasToDisplaySize(canvas) {    
    const { width, height } = canvas.getBoundingClientRect()    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
}

export let loader: LoaderFunction = async () => {
    const waypoints_req = async () => {
        const response = await fetch("https://red1.whyando.com/api/waypoints");
        return await response.json();
    }
    const ships_req = async () => {
        const response = await fetch("https://red1.whyando.com/api/ships");
        return await response.json();
    }
    const agent_req = async () => {
        const response = await fetch("https://red1.whyando.com/api/agent");
        return await response.json();
    }
    const [ agent, ships, waypoints ] = await Promise.all([
        agent_req(),
        ships_req(),
        waypoints_req(),
    ]);
    return json({
        waypoints,
        ships,
        agent,
    });
};

export default function Index() {
    const socket = useSocket();
    const canvasRef = useRef(null);

    // universe coords
    const centerRef = useRef({})
    const zoomRef = useRef(1)

    // pixel coords
    const isMouseDownRef = useRef(false)
    const lastMousePosRef = useRef({x: 0, y: 0})
    const panRef = useRef({x: 0, y: 0});

    const { waypoints, agent: initialAgent, ships: initalShips } = useLoaderData<typeof loader>();
    const [agent, setAgent] = React.useState(initialAgent);
    const [ships, setShips] = React.useState(initalShips);
    const [dimensions, setDimensions] = React.useState({
        width: 0,
        height: 0,
    })

    const render = () => {   
        if (!canvasRef.current) return;
        const { height, width } = canvasRef.current.getBoundingClientRect();
        resizeCanvasToDisplaySize(canvasRef.current);
        const ctx = canvasRef.current.getContext('2d');
        const renderInfo = {
            zoom: zoomRef.current,
            pan: panRef.current,
        }
        draw(ctx, renderInfo, height, width, waypoints, ships)
        requestAnimationFrame(render);
    }

    useEffect(() => {
        if (!socket) return;
        console.log('socket on index component', socket);

        const on_ship_upd = (ship: any) => {     
            setShips((ships: any[]) => {
                const idx = ships.findIndex((s) => s.symbol === ship.symbol);
                if (idx === -1) {
                    return ships;
                }
                const new_ships = [...ships];
                new_ships[idx] = ship;
                return new_ships;
            })
        }
        const on_agent_upd = (agent: any) => {
            setAgent(agent);
        }
        socket.on('ship_upd', on_ship_upd)
        socket.on('agent_upd', on_agent_upd)

        return () => {
            socket.off('ship_upd', on_ship_upd);
            socket.off('agent_upd', on_agent_upd);
        };
    }, [socket]);

    React.useEffect(() => {
        if (!canvasRef.current) return;
        // render()
    }, [canvasRef, dimensions, ships])

    const handleWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canvasRef.current) return;
        // TODO: either preserve center of map during zoom, or preserve point under cursor
        // const viewportMousePos = { x: e.clientX, y: e.clientY };
        // const topLeftCanvasPos = {
        //     x: canvasRef.current.offsetLeft,
        //     y: canvasRef.current.offsetTop
        // };
        zoomRef.current += e.deltaY * -0.001;
        zoomRef.current = Math.min(10, Math.max(1, zoomRef.current));
        // render()
    }
    const handleOnMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isMouseDownRef.current = true
        lastMousePosRef.current = {x: e.clientX, y: e.clientY}
    }
    const handleOnMouseMove = (e) => {
        if(!isMouseDownRef.current){return;}
        e.preventDefault();
        e.stopPropagation();
        const dx = e.clientX - lastMousePosRef.current.x
        const dy = e.clientY - lastMousePosRef.current.y
        panRef.current = {
            x: panRef.current.x + dx,
            y: panRef.current.y + dy,
        }
        lastMousePosRef.current = {x: e.clientX, y: e.clientY}
        // render()
    }
    const handleOnMouseUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isMouseDownRef.current = false
    }
    const handleOnMouseOut = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isMouseDownRef.current = false
    }

    React.useEffect(() => {
        render()
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    const system_symbol = agent.headquarters.split('-').slice(0, 2).join('-');
    return (
        <div>
            <canvas className="absolute left-0 top-0 h-full w-full z-0"
                ref={canvasRef}
                onMouseDown={(e) =>{handleOnMouseDown(e)}}
                onMouseMove={(e) =>{handleOnMouseMove(e)}}
                onMouseUp={(e) =>{handleOnMouseUp(e)}}
                onMouseOut={(e) =>{handleOnMouseOut(e)}}
                onWheel={(e) =>{handleWheel(e)}}
            />
            <div className="absolute left-0 top-0 z-10 m-2 min-w-80 min-h-80">
                <div className="text-white">
                    <div>{agent.symbol} - {system_symbol}</div>
                    <div>Credits: ${agent.credits}</div>
                    <div>Ships: {agent.shipCount}</div>
                </div>
            </div>
        </div>
    );
}
