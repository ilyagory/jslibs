"use strict";

/*
 *  Dependencies
 *
 *  - http://google.github.io/incremental-dom/
 *  - https://github.com/paolocaminiti/jsonml2idom
 */

class Table {
	/**
	 * @return {number}
	 */
	get currentPage() {
		return Math.ceil((this.offset + 1) / this.limit);
	}

	/**
	 * @returns {number}
	 */
	get pagesCount() {
		return Math.ceil(this.total / this.limit);
	}

	constructor(root, {limit, offset, columns, url}) {
		this.root = root;
		this.columns = columns;
		this.limit = limit || 100;
		this.offset = offset || 0;
		this.url = url;
		this.total = 0;
		this.rows = [];
	}

	request() {
		if (this.offset > this.limit && this.offset >= this.total) {
			this.offset = this.total - this.limit;
		}

		let q = {limit: this.limit, offset: this.offset};
		let u = this.url;

		if (Array.isArray(this.url)) {
			u = this.url[0];

			if (this.url && this.url.length > 0) {
				q = Object.assign({}, q, this.url[1]);
			}
		}

		return api(u, q, 'get').then(({rows, total}) => {
			this.rows = rows;
			this.total = total;
		});
	}

	assembleRow(row) {
		const tr = ['tr'];
		for (let cell of this.columns) {

			switch (cell.constructor) {
				// returns jsonml array or html
				case Function:
					const fcval = cell(row);
					if (fcval.constructor === Array) {
						tr.push(['td', ...fcval]);
					} else {
						tr.push(['td', fcval]);
					}
					break;

				// jsonml array
				case Array:
					tr.push(['td', ...cell]);
					break;

				// key of the data object
				case String:
					const scval = row[cell];
					if (scval === null || scval === undefined) {
						tr.push(['td']);
					} else {
						tr.push(['td', scval]);
					}
					break;

				// empty
				default:
					tr.push(['td']);
			}
		}

		return tr;
	}

	clickPage(pnum) {
		this.offset = pnum > 1 ? this.limit * (pnum - 1) : 0;
		this.show();
	}

	assemblePager() {
		if (this.limit >= this.total)
			return;

		const res = [];
		const pages = this.pagesCount;
		const cp = this.currentPage;
		const onclick = pnum => e => {
			e.preventDefault();
			this.clickPage(pnum);
		};

		for (let i = 1; i <= pages; i++) {
			res.push(['a', {href: `#?page=${i}`, onclick: onclick(i), 'class': cp === i ? 'active' : ''}, i]);
		}
		return ['.pager', ...res];
	}

	render() {
		const rows = this.rows.map(d => this.assembleRow(d));
		const table = ['.table', ['table', ['tbody', ...rows]]];
		const pages = this.assemblePager();

		if (Array.isArray(pages)) {
			table.push(pages);
		}

		IncrementalDOM.patch(this.root, jsonml2idom, table);
	}

	show() {
		return this.request().then(() => this.render());
	}
}

Table.create = (selector, options) => new Table(document.querySelector(selector), options);
