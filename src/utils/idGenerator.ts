const generateNumber = (): string => {
    return Math.floor(Math.random() * 10).toString();
}

const generateLetter = (): string => {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    const index = Math.floor(Math.random() * letters.length);
    // Use non-null assertion (!) because we know the array is not empty
    return Math.random() > 0.5 ? letters[index]!.toUpperCase() : letters[index]!;
}

const generateSpecialCharacter = (): string => {
    const characters = ["!", "@", "#", "$", "&", "_"];
    const index = Math.floor(Math.random() * (characters.length));
    return characters[index]!;
}

const callRandomGenerator = (generators: (() => string)[]): string => {
    const index = Math.floor(Math.random() * (generators.length));
    return generators[index]!()
}

export const GetUsername = (): string => {
    let userName: string = `${generateLetter()}${generateLetter()}${generateLetter()}${generateLetter()}`
    for (let index = 0; index < 5; index++) {
        userName += callRandomGenerator([generateNumber, generateSpecialCharacter]);
    }
    return userName;
}