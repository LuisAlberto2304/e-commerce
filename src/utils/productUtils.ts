export const normalizeColors = (colors: string[]): string[] => {
    const colorMap: { [key: string]: string } = {
        'black': 'Negro',
        'white': 'Blanco',
        'red': 'Rojo',
        'blue': 'Azul',
        'green': 'Verde',
        'yellow': 'Amarillo',
        'gray': 'Gris',
        'grey': 'Gris',
        'pink': 'Rosa',
        'purple': 'Morado',
        'orange': 'Naranja',
        'brown': 'Marrón',
        'beige': 'Beige'
    };

    const normalized = new Set<string>();

    colors.forEach(color => {
        const lowerColor = color.toLowerCase();
        const translated = colorMap[lowerColor] || color;

        // Mantener la capitalización correcta (primera letra mayúscula)
        const finalColor = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
        normalized.add(finalColor);
    });

    return Array.from(normalized).sort();
};

export const normalizeSizes = (sizes: string[]): string[] => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Talla Única'];
    const numericSizes: string[] = [];
    const standardSizes: string[] = [];

    sizes.forEach(size => {
        // Si es una talla numérica
        if (/^\d+$/.test(size)) {
            numericSizes.push(size);
        } else {
            standardSizes.push(size);
        }
    });

    // Ordenar numéricas
    numericSizes.sort((a, b) => parseInt(a) - parseInt(b));

    // Ordenar estándar según el orden definido
    standardSizes.sort((a, b) => {
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    return [...standardSizes, ...numericSizes];
};

export const translateColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
        'Red': 'Rojo',
        'Blue': 'Azul',
        'Green': 'Verde',
        'Yellow': 'Amarillo',
        'Black': 'Negro',
        'White': 'Blanco',
        'Gray': 'Gris',
        'Grey': 'Gris',
        'Pink': 'Rosa',
        'Purple': 'Morado',
        'Orange': 'Naranja',
        'Brown': 'Marrón',
        'Beige': 'Beige'
    };

    return colorMap[color] || color;
};

export const extractColorsFromText = (text: string): string[] => {
    if (!text) return [];

    const colors: string[] = [];
    const colorPatterns = [
        /\b(ROJO|AZUL|VERDE|AMARILLO|NEGRO|BLANCO|GRIS|ROSA|MORADO|NARANJA|MARRÓN|BEIGE|CAFE|MARRON)\b/gi,
        /\b(RED|BLUE|GREEN|YELLOW|BLACK|WHITE|GRAY|PINK|PURPLE|ORANGE|BROWN|BEIGE)\b/gi,
    ];

    colorPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                // Normalizar: Primera letra mayúscula, resto minúsculas
                const normalizedColor = match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
                // Traducir si es necesario
                const translatedColor = translateColor(normalizedColor);
                if (!colors.includes(translatedColor)) {
                    colors.push(translatedColor);
                }
            });
        }
    });

    return colors;
};

export const extractColorsFromVariantTitle = (text: string): string[] => {
    if (!text) return [];

    const colors: string[] = [];

    // Patrón para "Talla / Color" o "Talla - Color"
    const pattern = /\b(XS|S|M|L|XL|XXL|XXXL)\s*[\/\-]\s*([A-Za-z\s]+)/gi;
    const matches = text.matchAll(pattern);

    for (const match of matches) {
        if (match[2]) {
            const color = match[2].trim();
            // Normalizar el color (primera letra mayúscula)
            const normalizedColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
            if (!colors.includes(normalizedColor)) {
                colors.push(normalizedColor);
            }
        }
    }

    // También buscar colores sueltos
    const standaloneColors = extractColorsFromText(text);
    standaloneColors.forEach(color => {
        if (!colors.includes(color)) {
            colors.push(color);
        }
    });

    return colors;
};

export const extractSizesFromText = (text: string): string[] => {
    if (!text) return [];

    const sizes: string[] = [];
    const sizePatterns = [
        /\b(XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL)\b/gi,
        /\b(ONESIZE|ONE SIZE|UNICA TALLA|TALLA ÚNICA|UNICA)\b/gi,
        /\b(\d+(?:\.\d+)?[Mm]?[Ll]?)\b/g,
    ];

    sizePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const size = match.toUpperCase().trim();
                let normalizedSize = size;
                if (size === 'ONESIZE' || size === 'ONE SIZE' || size === 'UNICA TALLA' || size === 'TALLA ÚNICA' || size === 'UNICA') {
                    normalizedSize = 'Talla Única';
                }
                if (!sizes.includes(normalizedSize)) {
                    sizes.push(normalizedSize);
                }
            });
        }
    });

    return sizes;
};
