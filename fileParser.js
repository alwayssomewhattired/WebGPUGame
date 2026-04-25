
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js'

let m_obj = null;

export async function initFileParser() {
    const objResponse = await fetch('./models/psx-rat/rat.obj');
    const objBody = await objResponse.text();
    let obj = await (async() => {
        return new Promise((resolve, reject) => {
            m_obj = new OBJFile(objBody);
            m_obj.parse();
            resolve(m_obj);
        })
    })();
}

export function getModel() {
    if (!m_obj) {
        throw new Error("Model is not initialized!")
    }

    return m_obj;
}

