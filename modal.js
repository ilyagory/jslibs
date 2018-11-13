"use strict";

/*
 *  Dependencies
 *
 *  - http://google.github.io/incremental-dom/
 *  - https://github.com/paolocaminiti/jsonml2idom
 */

/**
 * @typedef {Object} ModalSub
 * @property {Function} onClose
 * @property {Function} cb
 */

IncrementalDOM.notifications.nodesCreated = (nodes) => {
	nodes.forEach(n => {
		const k = IncrementalDOM.getData(n).key;
		if (modal.createSubs.has(k))
			modal.createSubs.get(k).cb(n);
	});
};

/**
 *
 * @param {String} templateSelector
 * @param {Function} onClose
 * @returns {*}
 */
function modal(templateSelector, onClose) {
	let $template = document.querySelector(templateSelector);
	if (!$template)
		return Promise.reject();

	return new Promise(modal.getPromiseExecutor($template, onClose));
}

modal.config = {
	holderId: 'modal-holder'
};
/**
 * @type {Map<Symbol, ModalSub>}
 */
modal.createSubs = new Map();

/**
 * @param {HTMLTemplateElement} $template
 * @param {Function} onClose
 * @returns {Function}
 */
modal.getPromiseExecutor = ($template, onClose) => r => {
	const key = Symbol();
	/**
	 *
	 * @type {ModalSub}
	 */
	const sub = {};

	if (onClose instanceof Function)
		sub.onClose = onClose;

	sub.cb = node => {
		node.querySelector('.modal-body').appendChild($template.content.cloneNode(true));
		r([node, {close: () => modal.close(key)}]);
	};

	modal.createSubs.set(key, sub);
	modal.render(key);
};

modal.render = (key) => {
	IncrementalDOM.patch(modal.getHolder(modal.config.holderId), () => {
		for (let i = 0; i < modal.createSubs.size - 1; i++) {
			IncrementalDOM.skipNode();
		}
		jsonml2idom(modal.dom(key));
	});
};

modal.onHolderKeyup = e => {
	if (e.keyCode === 27) {
		modal.closeLast();
	}
};

modal.getHolder = id => {
	let holder = document.getElementById(id);
	if (holder == null) {
		holder = document.createElement('div');
		holder.id = id;
		document.body.appendChild(holder);
		window.addEventListener('keyup', modal.onHolderKeyup);
	}

	return holder;
};

modal.dom = key => key == null ? null : [
	'div', {class: 'modal', key},
	['.modal-container',
		['.modal-body']
	]
];


modal.close = key => {
	modal.render(null);
	let s = modal.createSubs.get(key);

	if (!s)
		return;

	if (s.onClose instanceof Function)
		s.onClose();

	modal.createSubs.delete(key);
	if (modal.createSubs.size === 0) {
		window.removeEventListener('keyup', modal.onHolderKeyup);
		document.getElementById(modal.config.holderId).remove();
	}
};


modal.closeLast = () => {
	let [key,] = Array.from(modal.createSubs)[modal.createSubs.size - 1];
	modal.close(key);
};
