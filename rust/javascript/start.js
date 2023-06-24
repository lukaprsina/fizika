const fs = require('fs');

let BOOK_COUNT = 0;
let UNSCRAMBLED_MULTICHOICE_COUNT = 0;

let metadata_set = false;
let score_list_set = false;
let output = {
    slides: [],
    videos: [],
    metadata: {},
    flags: {},
    variables: [],
    math: [],
    transitions: [],
    galleries: [],
    books: [],
    quiz: {
        multi: [],
        numeric: [],
        score_list: {}
    }
}

function checkRest(rest) {
    if (typeof rest !== 'undefined') {
        throw "Too many arguments";
    }
}

const Slides = {
    addSlide: (config, rest) => {
        checkRest(rest);
        output.slides.push(config)
    },
    addSpecialGoto: (name, callback, rest) => {
        checkRest(rest);
        // output.special_gotos.push({ name, callback: callback.toString() })        
        if (!callback.toString().startsWith("function() { return Hidden.showHidden("))
            throw "Special goto doesn't hide";
    },
    addTransition: (name, callback, rest) => {
        checkRest(rest);
        output.transitions.push({ name, callback: callback.toString() })
    },
}

const Flags = {
    setMetadata: (metadata, rest) => {
        checkRest(rest);
        if (metadata_set)
            throw "Metadata already set";

        output.metadata = metadata;
        metadata_set = true;
    },
    set: (key, value, rest) => {
        checkRest(rest);
        output.flags[key] = value;
    },
}

class VideoClass {
    constructor(id, config, rest) {
        checkRest(rest);

        let valid_keys = ["flowplayer", "html5"]
        for (const [key, value] of Object.entries(config)) {
            const index = valid_keys.indexOf(key);

            if (index > -1) { // only splice array when item is found
                valid_keys.splice(index, 1); // 2nd parameter means remove one item only                    
            } else {
                throw "Video has too few parameters"
            }
        }

        if (valid_keys.length !== 0)
            throw "Video has extra config parameters"

        const playlist = config.flowplayer.playlist;
        if (playlist.length !== 1)
            throw "Playlist has multiple or no videos"

        const url = playlist[0].url

        output.videos.push({ id, url });
    }
}

class VirtualBookClass {
    constructor() { }
    static declareBook() {
        output.books.push("Book")
        BOOK_COUNT += 1;
    }
}

const Variables = {
    setAtDocumentReady: (name, callback, rest) => {
        checkRest(rest);
        output.variables.push({ name, callback: callback.toString() })
    }
}

/* 
new Gallery.Gallery('fffb7edd38cbd2dd937ee30a88f8e996', {
    'vertical': false,
    'fullscreen': true,
    'kind': 'imageflow',
    'bigImageList': ['trenje/teza_klade.jpg', 'trenje/trenje_stat_brus_1.jpg', 'trenje/trenje_stat_les_pluta_1.jpg'],
    'flowAspectRatio': 2,
    'align': 'top',
    'labels': true,
    'height': null,
    'width': null,
    'bigImagePopups': {
        '?2': {
            'src': 'trenje/trenje_stat_les_pluta_1.jpg',
            'title': ''
        },
        '?1': {
            'src': 'trenje/trenje_stat_brus_1.jpg',
            'title': ''
        },
        '?0': {
            'src': 'trenje/teza_klade.jpg',
            'title': ''
        }
    },
    'maxCrop': 0.3,
    'size': 250
});
*/

class GalleryClass {
    constructor(id, config, rest) {
        checkRest(rest)
        output.galleries.push({ id, config })
    }
}

const MathElement = {
    addMath: (name, latex, rest) => {
        checkRest(rest);
        output.math.push({ name, latex })
    }
}

function assert(lhs, rhs) {
    if (lhs !== rhs)
        throw "Assert failed, lhs: " + lhs + ", rhs: " + rhs;
}

class MultiChoiceClass {
    constructor(name, id, config, rest) {
        checkRest(rest)
        let valid_keys = [
            "style",
            "weight",
            "title",
            "buttonsSameHeight",
            "answers",
            "pick",
            "scramble",
            "columns",
        ]

        for (const [key, value] of Object.entries(config)) {
            const index = valid_keys.indexOf(key);

            if (index > -1) { // only splice array when item is found
                valid_keys.splice(index, 1); // 2nd parameter means remove one item only                    
            } else {
                throw "Multichoice has too few parameters"
            }

            switch (key) {
                case "style":
                    assert(value, "radio")
                    break;
                case "weight":
                    assert(value, 1)
                    break;
                case "buttonsSameHeight":
                    assert(value, true)
                    break;
                case "pick":
                    assert(value, null)
                    break;
                case "scramble":
                    if (!value)
                        UNSCRAMBLED_MULTICHOICE_COUNT += 1;
                    break;
                case "columns":
                    assert(value, 2)
                    break;
            }
        }

        if (valid_keys.length !== 0)
            throw "Multichoice has extra config parameters"

        output.quiz.multi.push({ id, name, title: config.title, answers: config.answers })
    }
}

/* new NumericQuestion.NumericQuestion('7850286380154c4c9cfe6f9d4a3d9916', 'avtomobilcek', {
    'toleranceRelative': false,
    'tolerance': 0,
    'result': null,
    'weight': 1,
    'title': ['Avtomobilček', '534c6bed2041179420c428e6ac4a447f']
}); */

class NumericQuestionClass {
    constructor(id, name, config, rest) {
        checkRest(rest)
        let valid_keys = [
            "toleranceRelative",
            "tolerance",
            "result",
            "weight",
            "title",
        ]

        for (const [key, value] of Object.entries(config)) {
            const index = valid_keys.indexOf(key);

            if (index > -1) { // only splice array when item is found
                valid_keys.splice(index, 1); // 2nd parameter means remove one item only                    
            } else {
                throw "Video has too few parameters"
            }

            switch (key) {
                case "toleranceRelative":
                    assert(value, false)
                    break;
                case "tolerance":
                    assert(value, 0)
                    break;
                case "result":
                    assert(value, null)
                    break;
                case "weight":
                    assert(value, 1)
                    break;
            }
        }

        if (valid_keys.length !== 0)
            throw "Multichoice has extra config parameters"

        output.quiz.numeric.push({ id, name, title: config.title })
    }
}

/* 
new ScoreList.ScoreList('99155130a425da05d36cd068bc67fed8', {
    'all': true,
    'translations': {
        'Name': 'Ime',
        'Weight': 'Utež',
        'Average': 'Povprečje',
        'Score': 'Točke',
        'Penalty': 'Kazen',
        'Base': 'Osnova',
        'Average attempted': 'Povprečje izpolnjenih'
    },
    'details': false
});
*/

class ScoreListClass {
    constructor(id, config, rest) {
        checkRest(rest);
        if (score_list_set)
            throw "Score list already set";

        score_list_set = true;
        output.quiz.score_list = { id, config }
    }
}

const VirtualBookJS = {
    VirtualBook: VirtualBookClass
}

const NumericQuestion = {
    NumericQuestion: NumericQuestionClass,
}

class SingleChoiceClass {
    constructor() { }
}

const SingleChoice = {
    SingleChoice: SingleChoiceClass,
}

const ScoreList = {
    ScoreList: ScoreListClass,
}

const Gallery = {
    Gallery: GalleryClass,
}

const VideoModule = {
    Video: VideoClass
}

const MultiChoice = {
    MultiChoice: MultiChoiceClass,
}
