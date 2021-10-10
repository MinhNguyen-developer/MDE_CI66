var markdownParser = (function () {
  /**
   * Gjør en operasjon på hvert element i en array.
   * @param {Array} array - Listen med elementer
   * @param {Function} action - Funksjonen som skal kjøres på hvert element
   */
  function forEach(array, action) {
    for (var i = 0; i < array.length; i++) {
      action(array[i]);
    }
  }

  /**
   *
   */
  function map(transform, array) {
    var result = [];

    forEach(array, function (element) {
      result.push(transform(element));
    });

    return result;
  }

  function reduce(combine, base, array) {
    forEach(array, function (element) {
      base = combine(base, element);
    });
    return base;
  }

  function markdownFile() {
    return document.querySelector("#writearea").value;
  }

  function processParagraph(paragraph) {
    var header = 0;

    while (paragraph.charAt(0) == "#") {
      paragraph = paragraph.slice(1);
      header++;
    }

    return {
      type: header == 0 ? "p" : "h" + header,
      content: splitParagraph(paragraph),
    };
  }

  function splitParagraph(text) {
    var parts = []; // De forskjellige delene av paragrafen

    // Returnerer indeksen til den neste forekomsten av tegnet
    // eller slutten av paragrafen (text)
    function findNext(char) {
      var index = text.indexOf(char);
      return index == -1 ? text.length : index;
    }

    // Leser all tekst fram til et visst tegn
    // og returnerer denne teksten
    function readUntil(char) {
      var end = text.indexOf(char, 1);

      if (end == -1) throw new Error("Mangler et '" + char + "'-tegn");

      var part = text.slice(char.length, end);
      text = text.slice(end + char.length);
      return part;
    }

    function readAhead(numChars) {
      text = text.slice(0, numChars);
    }

    // Leser paragrafen
    function readNormal() {
      var end = reduce(
        Math.min,
        text.length,
        map(findNext, ["*", "**", "`", "[", "]", "![", "(", ")"])
      );
      var part = text.slice(0, end);
      text = text.slice(end);
      return part;
    }

    while (text != "") {
      // Fet skrift
      if (text.charAt(0) == "*" && text.charAt(1) != "*")
        parts.push(produceHTML(HTMLitalic(readUntil("*"))));
      // Kursiv skrift
      else if (text.charAt(0) == "*" && text.charAt(1) == "*")
        parts.push(produceHTML(HTMLbold(readUntil("**"))));
      // Kodesnutt
      else if (text.charAt(0) == "`")
        parts.push(produceHTML(HTMLcode(readUntil("`"))));
      // Link
      else if (text.charAt(0) == "[") {
        var linkName = readUntil("]");
        var linkUrl = readUntil(")");
        parts.push(produceHTML(HTMLlink(linkName, linkUrl)));
      }

      // Bilde
      else if (text.charAt(0) == "!" && text.charAt(1) == "[") {
        var altText = readUntil("]").slice(1);
        var imgUrl = readUntil(")");
        parts.push(produceHTML(HTMLimg(imgUrl, altText)));
      } else parts.push(readNormal());
    }

    return parts.join("");
  }

  function HTMLtag(name, content, attributes) {
    return {
      name: name,
      attributes: attributes,
      content: content,
    };
  }

  function HTMLlink(text, url) {
    return HTMLtag("a", [text], {
      href: url,
    });
  }

  function HTMLdocument(title, bodyContent) {
    return HTMLtag("html", [
      HTMLtag("head", [HTMLtag("title", [title])]),
      HTMLtag("body", bodyContent),
    ]);
  }

  function HTMLimg(src, alt) {
    return HTMLtag("img", [], {
      src: src,
      alt: alt,
    });
  }

  function HTMLbold(text) {
    return HTMLtag("strong", [text], {});
  }

  function HTMLitalic(text) {
    return HTMLtag("em", [text], {});
  }

  function HTMLcode(text) {
    return HTMLtag("pre", [HTMLtag("code", [text])]);
  }

  function produceHTML(element) {
    var pieces = [];

    function produceAttributes(attributes) {
      var result = [];

      if (attributes) {
        for (var name in attributes)
          result.push(" " + name + '="' + attributes[name] + '"');
      }

      return result.join("");
    }

    function render(element) {
      // Ren tekst
      if (typeof element == "string") {
        pieces.push(element);
      }

      // En HTML-tag uten innhold
      else if (!element.content || element.content.length == 0) {
        pieces.push(
          "<" + element.name + produceAttributes(element.attributes) + "/>"
        );
      }

      // En HTML-tag med innhold
      else {
        pieces.push(
          "<" + element.name + produceAttributes(element.attributes) + ">"
        );
        forEach(element.content, render);
        pieces.push("</" + element.name + ">");
      }
    }

    render(element);
    return pieces.join("");
  }

  function parseAndUpdate() {
    var paragraphs = map(processParagraph, markdownFile().split("\n\n"));
    var renderedHTML = "";
    for (var i = 0; i < paragraphs.length; i++)
      renderedHTML +=
        produceHTML(HTMLtag(paragraphs[i].type, paragraphs[i].content)) + "\n";

    document.querySelector("#renderview").innerHTML = renderedHTML;
  }

  return {
    run: function () {
      parseAndUpdate();
    },
  };
})();

console.log("Hello Web");
