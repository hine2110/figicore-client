
export function generateSKU(productName: string, variantOption: string, brandName?: string): string {
    const brandPrefix = (brandName || "GEN").substring(0, 3).toUpperCase();
    const namePrefix = productName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase() || "PRO";

    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit random

    // Format: BRAND-NAME-VAR-RANDOM
    // Example: BAN-GUN-RED-1029
    // If variant is "Standard" or empty, maybe just BRAND-NAME-RANDOM?
    // User asked for: Bandai + Gundam + VerKA -> BAN-GUN-1029 (wait, user said Variant Option in prompt?)
    // User ex: "Bandai + Gundam -> BAN-GUN-1029" (The example didn't explicitly show variant part usages but logically it might be needed if multiple variants).
    // Let's follow the user's explicit example logic: "Take first 3 chars of Brand... Take first 3 chars of Product Name... Add random".

    return `${brandPrefix}-${namePrefix}-${randomSuffix}`;
}
