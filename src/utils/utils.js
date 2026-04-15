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