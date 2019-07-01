const ScriptBD = require("./script/index.json");
const ManualBD = require("./manual/index.json");

const scriptBaseURL = "https://docs.unity3d.com/ScriptReference/";
const manualBaseURL = "https://docs.unity3d.com/Manual/";

function getPageInfo(bd, id) {
	const realId = bd.info[id][1];
	return {
		id: id,
		title: bd.pages[realId][1],
		url: bd.pages[realId][0] + ".html",
		summary: "" + bd.info[id][0]
	};
}

//Алгоритм стырил напрямую с https://docs.unity.com/
function getSearchResults(bd, terms, query, limit = -1) {
	const common = bd.common;
	const searchIndex = bd.searchIndex;

	const score = {};
	const found_common = [];
	let min_score = terms.length;

	for (var i = 0; i < terms.length; i++) {
		var term = terms[i];
		if (common[term]) {
			found_common.push(term);
			min_score--;
		}

		if (searchIndex[term]) {
			for (var j = 0; j < searchIndex[term].length; j++) {
				var page = searchIndex[term][j];
				if (!score[page]) {
					score[page] = 0;
				}
				++score[page];
			}
		}

		for (var si in searchIndex) {
			if (si.slice(0, term.length) == term) {
				for (var j = 0; j < searchIndex[si].length; j++) {
					var page = searchIndex[si][j];
					if (!score[page]) {
						score[page] = 0;
					}
					++score[page];
				}
			}
		}
	}

	var results = new Array();
	for (let page_id in score) {
		const info = getPageInfo(bd, page_id);
		const title = info.title;
		const summary = info.summary;
		const summary_lower = summary.toLowerCase();
		const title_lower = title.toLowerCase();

		if (score[page_id] >= min_score) {
			results.push(page_id);

			let placement;
			// Adjust scores for better matches
			for (let i = 0; i < terms.length; i++) {
				let term = terms[i];
				if ((placement = title_lower.indexOf(term)) > -1) {
					score[page_id] += 50;
					if (placement == 0 || title[placement - 1] == ".") score[page_id] += 500;
					if (placement + term.length == title.length || title[placement + term.length] == ".") {
						score[page_id] += 500;
					}
				} else if ((placement = summary_lower.indexOf(term)) > -1) {
					score[page_id] += placement < 10 ? 20 - placement : 10;
				}
			}

			if (title_lower == query) {
				score[page_id] += 10000;
			} else if ((placement = title_lower.indexOf(query)) > -1) {
				score[page_id] += placement < 100 ? 200 - placement : 100;
			} else if ((placement = summary_lower.indexOf(query)) > -1) {
				score[page_id] += placement < 25 ? 50 - placement : 25;
			}
		}
	}

	results = results.sort(function(a, b) {
		if (score[b] == score[a]) {
			// sort alphabetically by title if score is the same
			var x = getPageInfo(bd, a).title.toLowerCase();
			var y = getPageInfo(bd, b).title.toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		} else {
			// else by score descending
			return score[b] - score[a];
		}
	});

	if (limit > 0) {
		results.length = limit;
	}

	const set = new Set(results);
	return [...set].map(e => ({
		id: e,
		score: score[e]
	}));
}

function search(query, limit = 30) {
	const terms = query
		.split(/[^A-z]/gm)
		.map(e => e.toLowerCase())
		.filter(e => e);

	if (terms.length == 0) return [];

	let isManual = false;
	if (terms[0].startsWith("man")) {
		if (terms.length == 1) {
			return [];
		}

		isManual = true;
		terms.splice(0, 1);
	}

	const bd = isManual ? ManualBD : ScriptBD;

	const results = getSearchResults(bd, terms, query, limit)
		.filter(e => e.id)
		.map(e => {
			const info = getPageInfo(bd, e.id);
			return Object.assign(info, {
				id: e.id,
				url: isManual ? manualBaseURL + info.url : scriptBaseURL + info.url,
				score: e.score,
				isManual: isManual
			});
		});

	return results;
}

module.exports = {
	search
};
