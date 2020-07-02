import re
import spacy


ner = spacy.load("en_core_web_sm")


def getDeets(inp):
    inp = inp + "."
    doc = ner(inp)
    num = None
    covidstat = {}
    result = []
    for ent in doc.ents:
        if ent.label_ in ["CARDINAL", "DATE", "TIME", "QUANTITY"]:
            num = ent.text
            covidstat[num] = []
        elif num:
            covidstat[num].append(ent.text)
    for infected, districts in covidstat.items():
        for district in districts:
            result.append("".join([district, "-", infected]))
    return result


def main(bigStr):
    r = getDeets(bigStr)
    for line in r:
        print(line)


if __name__ == "__main__":
    print("Press CTRL+D to exit mode")
    contents = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        contents.append(line)
    bigStr = " ".join(contents)
    main(bigStr)
