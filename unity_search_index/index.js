const base = require("./base");

const baseUrl = "https://docs.unity3d.com/ScriptReference/";

function getPageInfo(id) {
    
    return {
        id : id,
        title : base.pages[id][1],
        url : baseUrl + base.pages[id][0] + ".html",
        summary : "" + base.info[id][0]
    };
}

//Алгоритм стырил напрямую с https://docs.unity.com/

function getSearchResults(terms, query, limit = -1) {
	const common = base.common;
	const searchIndex = base.searchIndex;

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

        const info = getPageInfo(page_id);
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
			var x = getPageInfo(a).title.toLowerCase();
			var y = getPageInfo(b).title.toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		} else {
			// else by score descending
			return score[b] - score[a];
		}
    });

    if(limit > 0) {
        results.length = limit;
    }

    const set = new Set(results);
	return [...set].map((e)=>({
        id : e,
        score : score[e]
    }));
}

function search(query, limit = 30) {
    const terms = query.split(/[^A-z]/gm)
        .map(e => e.toLowerCase())
        .filter(e => e);
	
	if(terms.length == 0) return [];

	const search = getSearchResults(terms, query, limit);

	const results = getSearchResults(terms, query, limit)
		.filter(e => e.id)
		.map((e)=>{
			return Object.assign(getPageInfo(e.id), {
				id : e.id, score : e.score
			});
    	});
    
    return results;
}

module.exports = {
	search,
};
