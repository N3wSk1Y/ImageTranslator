const lg = {
    "en": "Английский",
    "ar": "Арабский",
    "hu": "Венгерский",
    "vi": "Вьетнамский",
    "el": "Греческий",
    "da": "Датский",
    "he": "Иврит",
    "id": "Индонезийский",
    "es": "Испанский",
    "it": "Итальянский",
    "ca": "Каталанский",
    "zh": "Китайский",
    "ko": "Корейски",
    "ms": "Малайский",
    "de": "Немецкий",
    "nl": "Нидерландский",
    "no": "Норвежский",
    "pl": "Польский",
    "pt": "Португальский",
    "ro": "Румынский",
    "ru": "Русский",
    "sk": "Словацкий",
    "th": "Тайский",
    "tr": "Турецкий",
    "uk": "Украинский",
    "fi": "Финский",
    "fr": "Французский",
    "hi": "Хинди",
    "hr": "Хорватски",
    "cs": "Чешский",
    "sv": "Шведский",
    "ja": "Японский",
    "et": "Эстонский",
    "lv": "Латышский",
    "lt": "Литовский",
    "is": "Исландский",
    "sl": "Словенский"
}
const languages = Object.keys(lg)
figma.showUI(__html__, { visible: false });
const selection = figma.currentPage.selection
const selectionText = getTextNodes()

function getTextNodes () {
    const result = figma.currentPage.findAllWithCriteria({ types: ['TEXT'] }).filter(node => figma.currentPage.selection.includes(node))
    return result
}

function topNodes (selectedTextNodes) {
    let nodes = []
    selectedTextNodes.forEach(textNode => {
        let currentNode = textNode
        for (let x = 0; x < 100; x++) {
            if (currentNode.parent.type !== 'PAGE')
                currentNode = currentNode.parent
            else {
                nodes.push({
                    textNode: textNode,
                    frameNode: currentNode
                })
                break        
            }
        }
    })
    let result = []
    nodes.forEach(element => {
        const subTextNodes = nodes.filter(object => object.frameNode === element.frameNode)
        nodes = nodes.filter(object => object.frameNode !== element.frameNode)
        for (let x = 0; x < subTextNodes.length; x++) {
            subTextNodes[x] = subTextNodes[x].textNode
        }
        result.push({
            frameNode: element.frameNode,
            textNodes: subTextNodes
        })
    });
    return result.filter(object => object.textNodes.length > 0);
}

let selectionIndex = 0;
let text = ""
let selectedFrame
console.log(topNodes(getTextNodes()))

figma.ui.onmessage = message => {
    if (message.type === 'show-translation') {
        console.log(`${text}[${message.lang}] => ${message.responseText[0]}`)
        const textElements = message.responseText[0].split("*")
        const lang = message.lang
        if (!lg[lang]) {
            if (languages.indexOf(lang) < languages.length && languages.indexOf(lang) >= 0) {
                figma.ui.postMessage({ type: 'translation', lang: languages[languages.indexOf(lang)+1], text: text });
            } else {
                // Переход на следующий фрейм
                if (selectionIndex + 1 < topNodes(getTextNodes()).length) {
                    selectionIndex++
                    handleNewFrame(selectionIndex)
                } else 
                    figma.closePlugin()
            }
        } else {
            const clonnedNode = selectedFrame.clone()
            clonnedNode.y += clonnedNode.height * (languages.indexOf(lang)+1) + (clonnedNode.height + 100) * (languages.indexOf(lang)+1)
            clonnedNode.name = selectedFrame.name +  " " + lg[lang]
            const clonnedNodeTexts = clonnedNode.findAllWithCriteria({ types: ['TEXT'] })
            const resultClonnedNodeTexts = clonnedNodeTexts.filter(textNode => text.includes(textNode.characters))
            for (let x = 0; x < resultClonnedNodeTexts.length; x++) {
                // console.log(x + " " + resultClonnedNodeTexts[x].characters + " " + textElements[x])
                if (textElements[x]) {
                    figma.loadFontAsync(resultClonnedNodeTexts[x].fontName).then(() => {
                        resultClonnedNodeTexts[x].characters = textElements[x]
                    })
                }
            }
            if (languages.indexOf(lang) < languages.length && languages.indexOf(lang) >= 0) {
                figma.ui.postMessage({ type: 'translation', lang: languages[languages.indexOf(lang)+1], text: text });
            } else {
                // Переход на следующий фрейм
                if(selectionIndex + 1 < topNodes(getTextNodes()).length) {
                    selectionIndex++
                    handleNewFrame(selectionIndex)
                } else 
                    figma.closePlugin()
            }
        }
    }
}

handleNewFrame(selectionIndex)
function handleNewFrame(selectionIndex) {
    const node = topNodes(getTextNodes())[selectionIndex]
    console.log(topNodes(getTextNodes()))
    let texts = []
    node.textNodes.forEach(element => {
        texts.push(element.characters)
    });
    text = texts.join("*")
    selectedFrame = node.frameNode
    figma.ui.postMessage({ type: 'translation', lang: languages[0], text: text });
}
