import { TECHS_LIST } from "../constants/techs";

export class ConfigTechService {

    private static normalizeTechKey = (key: string) =>
        key
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replace(/\s+/g, "");

    public static getTechIdByKey = (key: string) => {
        const normalizedKey = ConfigTechService.normalizeTechKey(key);
        return TECHS_LIST[normalizedKey as keyof typeof TECHS_LIST] || null;
    }

}