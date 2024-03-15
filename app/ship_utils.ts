import assert from 'assert';

export function ship_symbol_base10(a: string) {
    // parse WHY-ANDO-A4 by splitting on the dash and taking the final part, and then parsing it as hex
    const last = a.split('-').pop();
    assert(last, 'invalid symbol');
    return parseInt(last, 16);
}

export function ship_model(ship: any) {
    // find the model in SHIP_MODELS with matching frame, reactor, and engine
    const matchingModels = Object.entries(SHIP_MODELS).filter(([_, shipModel]) => {
        if (ship.frame.symbol !== shipModel.frame || 
            ship.reactor.symbol !== shipModel.reactor || 
            ship.engine.symbol !== shipModel.engine) {
            return false;
        }
        for (const module of shipModel.req_modules) {
            if (!ship.modules.some(m => m.symbol === module)) {
                return false;
            }
        }
        for (const mount of shipModel.req_mounts) {
            if (!ship.mounts.some(m => m.symbol === mount)) {
                return false;
            }
        }
        return true;
    });

    if (matchingModels.length === 1) {
        return matchingModels[0][0].slice(5);
    }
    throw new Error(`${matchingModels.length} matching models for ship ${ship.symbol} with frame: ${ship.frame.symbol}, reactor: ${ship.reactor.symbol}, engine: ${ship.engine.symbol}`);
}

const SHIP_MODELS = {
    "SHIP_COMMAND_FRIGATE": {
        frame: "FRAME_FRIGATE",
        reactor: "REACTOR_FISSION_I",
        engine: "ENGINE_ION_DRIVE_II",
        req_modules: [],
        req_mounts: []
    },
    "SHIP_PROBE": {
        frame: "FRAME_PROBE",
        reactor: "REACTOR_SOLAR_I",
        engine: "ENGINE_IMPULSE_DRIVE_I",
        req_modules: [],
        req_mounts: []
    },
    "SHIP_LIGHT_SHUTTLE": {
        frame: "FRAME_SHUTTLE",
        reactor: "REACTOR_CHEMICAL_I",
        engine: "ENGINE_IMPULSE_DRIVE_I",
        req_modules: [],
        req_mounts: []
    },
    "SHIP_LIGHT_HAULER": {
        frame: "FRAME_LIGHT_FREIGHTER",
        reactor: "REACTOR_CHEMICAL_I",
        engine: "ENGINE_ION_DRIVE_I",
        req_modules: [],
        req_mounts: []
    },
    "SHIP_MINING_DRONE": {
        frame: "FRAME_DRONE",
        reactor: "REACTOR_CHEMICAL_I",
        engine: "ENGINE_IMPULSE_DRIVE_I",
        req_modules: ["MODULE_MINERAL_PROCESSOR_I"],
        req_mounts: ["MOUNT_MINING_LASER_I"]
    },
    "SHIP_SURVEYOR": {
        frame: "FRAME_DRONE",
        reactor: "REACTOR_CHEMICAL_I",
        engine: "ENGINE_IMPULSE_DRIVE_I",
        req_modules: [],
        req_mounts: ["MOUNT_SURVEYOR_I"]
    },
    "SHIP_SIPHON_DRONE": {
        frame: "FRAME_DRONE",
        reactor: "REACTOR_CHEMICAL_I",
        engine: "ENGINE_IMPULSE_DRIVE_I",
        req_modules: ["MODULE_GAS_PROCESSOR_I"],
        req_mounts: ["MOUNT_GAS_SIPHON_I"]
    },
    "SHIP_REFINING_FREIGHTER": {
        frame: "FRAME_HEAVY_FREIGHTER",
        reactor: "REACTOR_FUSION_I",
        engine: "ENGINE_ION_DRIVE_II",
        req_modules: ["MODULE_CARGO_HOLD_III", "MODULE_ORE_REFINERY_I"],
        req_mounts: ["MOUNT_MISSILE_LAUNCHER_I"],
    },
    "SHIP_ORE_HOUND": {
        frame: "FRAME_MINER",
        reactor: "REACTOR_FISSION_I",
        engine: "ENGINE_ION_DRIVE_I",
        req_modules: ["MODULE_MINERAL_PROCESSOR_I"],
        req_mounts: ["MOUNT_MINING_LASER_II", "MOUNT_SURVEYOR_I"],
    },
    "SHIP_EXPLORER": {
        frame: "FRAME_EXPLORER",
        reactor: "REACTOR_FUSION_I",
        engine: "ENGINE_ION_DRIVE_II",
        req_modules: ["MODULE_WARP_DRIVE_I"],
        req_mounts: ["MOUNT_SENSOR_ARRAY_II", "MOUNT_GAS_SIPHON_II"],
    },
};
