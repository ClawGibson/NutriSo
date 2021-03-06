import keys from './excelKeys';

const groups = {
    [keys.grupoExportable]: [
        'Leches',
        'Quesos',
        'Alimentos de origen animal',
        'Otros',
        'Verduras',
        'Frutas',
        'Bebidas',
        'Aceites con proteina',
        'Leguminosas',
        'Cereales sin grasa',
        'Cereales con grasa',
        'Aceites sin proteina',
        'Condimentos',
        'Azucares con y sin grasa',
        'Comida rapida',
        'Comida mexicana',
        'Postres mexicanos',
        'Bebidas alcoholicas',
    ],
    [keys.subGrupoExportable]: [
        'Leche sin azucar',
        'Leche con azucar',
        'Bebidas',
        'Quesos bajos en grasa',
        'Aves',
        'Carnes rojas',
        'Pescados y mariscos',
        'Otros',
        'Carnes rojas industrializadas',
        'Quesos altos en grasa',
        'Anaranjadas',
        'Verdes',
        'Rojas',
        'Moradas',
        'Blancas',
        'Industrializada',
        'Aceites con proteina',
        'Leguminosas',
        'Maiz',
        'Tuberculo',
        'Trigo',
        'Granos enteros',
        'Avena',
        'Arroz',
        'Amaranto',
        'Quinoa',
        'Cereal con grasa',
        'Aceites sin proteina',
        'Condimentos',
        'Azucares sin grasa',
        'Azucares con grasa',
        'Comida rapida',
        'Comida mexicana',
        'Bebidas alcoholicas',
    ],
    [keys.ultraProcesados]: [
        'Ultra-procesado',
        'Lacteos',
        'Huevo',
        'Pescados y mariscos',
        'Pollo',
        'Carnes rojas y procesadas',
        'Vegetales',
        'Frutas',
        'Semillas y grasas saludables',
        'Leguminosas',
        'Cereales integrales',
        'Alimentos altos en azucares, grasas trans y saturadas',
        'Alimentos y platillos mexicanos',
    ],
    [keys.subGrupoAdecuada]: [
        'Alimento occidentalizado',
        'Receta mexicana',
        'Alimento mexicano',
        'Receta occidentalizada',
    ],
};

Object.freeze(groups);

export default groups;
