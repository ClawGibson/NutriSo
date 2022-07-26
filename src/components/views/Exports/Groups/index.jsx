import React, { useState, useEffect } from 'react';
import apiURL from '../../../../axios/axiosConfig';

import { message } from 'antd';
import dayjs from 'dayjs';

import ButtonsArea from '../../../commons/ButtonsArea';
import CustomExport from '../../../commons/CustomExport';
import { baseColumns } from '../data';
import * as calories from '../data/calories';
import * as vitamins from '../data/vitamins';
import * as minerals from '../data/minerals';
import * as glycemic from '../data/glycemic';
import * as environmental from '../data/environmental';
import * as economic from '../data/economic';
import * as bioactives from '../data/bioactives';
import * as additives from '../data/additives';
import * as extraColumns2 from '../data/extraColumns';
import * as food from '../data/foodGroups';
import groups from '../data/excelGroups';
import keys from '../data/excelKeys';
import {
    getArrayByGroups,
    normalizeArrayToExport,
    getRowValues,
    generateCsvRows,
    unifyGroups,
    getMaxGroupByReg,
    generateFinalCsvRows,
} from '../utils';

import { isEmptyArray } from '../../../../utils';

const Groups = ({ selected = false, setLoading }) => {
    const [columns, setColumns] = useState([
        ...baseColumns,
        ...food.groupColumns0,
        ...extraColumns2.extraColumns0,
        ...calories.caloriasMacronutrientes0,
        ...vitamins.vitaminas0,
        ...minerals.minerales0,
        ...glycemic.aspectoGlucemico0,
        ...environmental.aspectosMedioambientales0,
        ...economic.aspectosEconomicos0,
        ...bioactives.componentesBioactivos0,
        ...additives.aditivosAlimentarios0,
    ]);
    const [foodReady, setFoodReady] = useState(false);
    const [usersData, setUsersData] = useState([]);
    const [exportData, setExportData] = useState(null);
    const [fileReady, setFileReady] = useState(false);

    useEffect(() => {
        selected && getExportData();
        return () => {
            setExportData(null);
            setFileReady(false);
        };
    }, [selected]);

    useEffect(() => {
        foodReady && createExportData();
    }, [foodReady]);

    useEffect(() => {
        return () => {
            setLoading(false);
        };
    }, []);

    const onFileReady = () => {
        setFileReady(true);
        setLoading(false);
    };

    const handleCancel = () => {
        setFileReady(false);
        setExportData(null);
        setLoading(false);
    };

    const getExportData = async () => {
        console.log('Obteniendo datos de exportación...');
        try {
            const foods = [];
            const usersAux = [];

            const { data } = await apiURL.get('registroDietetico/exports');

            if (data?.length <= 0) {
                message.error('No hay datos para exportar');
                handleCancel();
                return;
            }
            data.forEach((elem) => {
                const { alimentos, horario, id, usuario } = elem;

                alimentos.forEach((food) =>
                    foods.push({
                        ...food.id,
                        cantidad: food.cantidad,
                        horario,
                        idRegistro: id,
                        usuario,
                    })
                );
            });

            foods.forEach((food) => {
                const { usuario, horario, idRegistro, grupoExportable } = food;

                const isPartOfGroup = groups[keys.grupoExportable].includes(grupoExportable);

                if (!isPartOfGroup) return;

                const date = dayjs(horario).format('DD/MM/YYYY');

                const newData = {
                    idRegistro,
                    idParticipante: usuario,
                    fechaRegistro: date,
                };

                const newState = normalizeArrayToExport({
                    state: getArrayByGroups(groups[keys.grupoExportable]),
                    group: grupoExportable,
                    food,
                });

                const auxSuper = {
                    ...newData,
                    ...newState,
                };

                usersAux.push(auxSuper);
            });

            setUsersData(usersAux);
            setFoodReady(true);
        } catch (error) {
            handleCancel();
            message.error('Error al obtener los datos');
            console.groupCollapsed('[Exports] getExportData');
            console.error(error);
            console.groupEnd();
        }
    };

    const createExportData = () => {
        console.log('Armando los datos de exportación...');
        try {
            const rows = getRowValues(usersData);
            const unified = unifyGroups(rows);

            if (isEmptyArray(unified)) {
                message.info('No hay datos para exportar');
                handleCancel();
                return;
            }

            const csvRowsPreview = generateCsvRows(unified);

            const newColumns = columns;
            console.log('prev', { newColumns });
            let maxGroup = 0;
            getMaxGroupByReg(csvRowsPreview, (res) => (maxGroup = res));

            for (let i = 0; i < maxGroup; i++) {
                // console.log('i', i);
                // if (i === 0) {
                //     i++;
                //     return;
                // }
                newColumns.push(
                    ...food[`groupColumns${0}`],
                    ...extraColumns2[`extraColumns${0}`],
                    ...calories[`caloriasMacronutrientes${0}`],
                    ...vitamins[`vitaminas${0}`],
                    ...minerals[`minerales${0}`],
                    ...glycemic[`aspectoGlucemico${0}`],
                    ...environmental[`aspectosMedioambientales${0}`],
                    ...economic[`aspectosEconomicos2`],
                    ...bioactives[`componentesBioactivos${0}`],
                    ...additives[`aditivosAlimentarios${0}`]
                );
            }
            console.log('next', { newColumns });
            const cvsRows = generateFinalCsvRows(csvRowsPreview);

            const finalColumns = [];
            newColumns.forEach((columnProps) => {
                finalColumns.push(columnProps.title);
            });
            console.log({ finalColumns });
            const rowsAux = [];

            cvsRows.forEach((row) => {
                row.forEach((register) => {
                    console.log({ register });
                });
            });

            // console.log({ csvRowsPreview, cvsRows });
            // setExportData(cvsRows);
            // setTimeout(() => {
            //     onFileReady();
            // }, 1000);
        } catch (error) {
            handleCancel();
            message.error('Ocurrió un error al armar los datos para exportar');
            console.groupCollapsed('[Exports] createExportData');
            console.error(error);
            console.groupEnd();
        }
    };

    return <CustomExport dataSource={exportData} fileReady={fileReady} />;

    // return (
    //     <ButtonsArea
    //         fileReady={fileReady}
    //         xlsxData={{
    //             columns: columns,
    //             data: exportData,
    //             fileName: `Grupos ${dayjs(new Date()).format('DD-MM-YYYY')}`,
    //         }}
    //     />
    // );
};

export default Groups;
