
export function getMagFilter(glEnum) {
    switch (glEnum) {
        case 9728: return "nearest";
        case 9729: return "linear";
        default:   return "linear";
    }
}

export function getMinFilter(glEnum) {
    switch (glEnum) {
        case 9728:
            return {
                minFilter: "nearest",
                mipmapFilter: "nearest"
        };
        case 9729:
            return {
                minFilter: "linear",
                mimmapFilter: "nearest"
        };
        case 9984:
            return {
                minFilter: "nearest",
                mipmapFilter: "nearest"
        };
        case 9985:
            return {
                minFilter: "linear",
                mimmapFilter: "nearest"
        };
        case 9986:
            return {
                minFilter: "nearest",
                mipmapFilter: "linear"
        };
        case 9987:
            return {
                minFilter: "linear",
                mimmapFilter: "linear"
        };
        default:
            return {
                minFilter: "linear",
                minmapFilter: "linear"
        };
    }
}

export function getAddressMode(glEnum) {
    switch (glEnum) {
        case 33071: return "clamp-to-edge";
        case 33648: return "mirror-repeat";
        case 10497: return "repeat";
        default:    return "repeat";
    }
}