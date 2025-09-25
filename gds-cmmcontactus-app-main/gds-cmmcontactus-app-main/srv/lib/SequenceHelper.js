module.exports = class SequenceHelper {
	constructor(options) {
		this.db = options.db;
		this.sequence = options.sequence;
		this.table = options.table;
		this.field = options.field || "ID";
	}

	getNextNumber() {

		return new Promise((resolve, reject) => {

			let nextNumber = 0;
			switch (this.db.kind) {
				case "hana":
					this.db.run(`SELECT MAX(TO_INTEGER(${this.field})) as ID FROM ${this.table}`)
						.then(result => {
							nextNumber = result[0].ID+1;
							resolve(nextNumber);
						})
						.catch(error => {
							reject(error);
						});

					break;
				case "sql":
				case "sqlite":

					this.db.run(`SELECT MAX("${this.field}") FROM "${this.table}"`)
						.then(result => {

							let placeHolder = parseInt(result[0][`MAX("${this.field}")`]) + 1;
							nextNumber = isNaN(placeHolder) ? 1 : placeHolder;
							resolve(nextNumber);
						})
						.catch(error => {
							reject(error);
						});
					break;
				default:
					reject(new Error(`Unsupported DB kind --> ${this.db.kind}`));
			}
		});
	}
};