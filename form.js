"use strict";

const form = {
	blockedEvent(e) {
		e.stopImmediatePropagation();
		return false;
	},
	block(form) {
		form.addEventListener('submit', form.blockedEvent);
		form.querySelector('button[type=submit]').disabled = true;
	},
	unblock(form) {
		form.removeEventListener('submit', form.blockedEvent);
		form.querySelector('button[type=submit]').disabled = false;
	},
	/**
	 * @param {HTMLFormElement} form
	 * @param {Object} valObj
	 */
	setValues(form, valObj) {
		const keys = Object.keys(valObj);
		if (keys.length === 0)
			return;

		for (let el of form.elements) {
			if (keys.indexOf(el.name) === -1)
				continue;

			let elVal = valObj[el.name];
			switch (el.type) {
				case 'radio':
					el.checked = el.value == elVal;
					break;
				case 'checkbox':
					el.checked = elVal == 1;
					break;
				case 'datetime-local':
					elVal = moment.utc(elVal);
					elVal.local();
					el.value = elVal.format('Y-MM-DDTHH:mm');
					break;
				default:
					el.value = elVal;
			}
		}
	},
	setOptions(form, optObj) {
		const keys = Object.keys(optObj);
		if (keys.length === 0)
			return;

		for (let el of form.elements) {
			if (keys.indexOf(el.name) === -1)
				continue;

			const elOpts = optObj[el.name];
			if (el instanceof HTMLSelectElement) {
				elOpts.forEach(([value, text]) => {
					const opt = document.createElement('option');
					opt.value = value;
					opt.innerHTML = text;
					el.appendChild(opt);
				});
			}
		}
	}
};