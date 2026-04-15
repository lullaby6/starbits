export async function toggleFullscreen(element = document.documentElement) {
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
            await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Safari
            await element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { // IE11
            await element.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE11
            document.msExitFullscreen();
        }
    }
}

export function $(query) {
    return document.querySelector(query)
}

export function $$(query) {
    return document.querySelectorAll(query)
}

export function $id(id) {
    return document.getElementById(id)
}

export function $event(query, event, callback) {
    return document.querySelector(query).addEventListener(event, callback)
}

export function $idEvent(id, event, callback) {
    return document.getElementById(id).addEventListener(event, callback)
}