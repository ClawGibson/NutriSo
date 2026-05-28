import React, { useState, useEffect } from 'react';
import apiURL from '../../../../axios/axiosConfig';
import { Tabs, Form, Select, Checkbox } from 'antd';

import { capitilizeWord } from '../../../../utils';
import { Rules } from '../../../../utils/formRules';

import './PathologicalBackground.scss'

const SolarExposition = ({ id }) => {
    const [form3] = Form.useForm();
    const [info, setInfo] = useState({});
    const [infoExpoSol, setInfoExpoSol] = useState({});
    const [ExpoSolChecBloSolar, setExpoSolCheckBloSolar] = useState({});


    useEffect(() => {
        getHistorialClinico();

        return () => {

        };
    }, [id]);

    const getHistorialClinico = async () => {
        try {
            const { data, status } = await apiURL.get(`historialClinico/individual?usuario=${id}`);

            if (status === 200 || data.length > 0) {
                const minutosAlSol = data[0]?.minutosAlSol.map((elem) => elem.valor);

                setInfoExpoSol({
                    minutosAlSol: minutosAlSol,
                });
            }
        } catch (error) {
            console.groupCollapsed('Error en la funcion fetchHistorialClinico');
            console.error(error);
            console.groupEnd();
        }
    };

    const updatePathological = async (values) => {
        try {
            if (infoExpoSol?.minutosAlSol) {
                const body = {
                    usuario: info.usuario,
                    minutosAlSol: {
                        valor: values.minutosAlSol,
                        fecha: new Date(),
                    },
                    cubresTuPiel: { valor: values.cubresTuPiel, fecha: new Date() },
                    bloqueadorSolar: ExpoSolChecBloSolar ? 'No' : { valor: values.bloqueadorSolar, fecha: new Date() },
                    diasXsemana: ExpoSolChecBloSolar ? 'N/A' : { valor: values.diasXsemana, fecha: new Date() },
                };
                console.log('Body', body);
                console.log('PATCH');

                const { data } = await apiURL.patch(`historialClinico/individual?usuario=${id}`, body);
                console.log(data);
            } else {
                const body = {
                    usuario: info.usuario,
                    minutosAlSol: [{ valor: values.minutosAlSol, fecha: new Date() }],
                    cubresTuPiel: [{ valor: values.cubresTuPiel, fecha: new Date() }],
                    bloqueadorSolar: [
                        ExpoSolChecBloSolar ? 'No' : { valor: values.bloqueadorSolar, fecha: new Date() },
                    ],
                    diasXsemana: [ExpoSolChecBloSolar ? 'N/A' : { valor: values.diasXsemana, fecha: new Date() }],
                };
                console.log('Body', body);
                console.log('POST');

                const { data } = await apiURL.post(`historialClinico/individual?usuario=${id}`, body);
                console.log(data);
            }
        } catch (error) {
            console.groupCollapsed('[ERROR] updateHistorialClinico');
            console.error(error);
            console.groupEnd();
        }
    };



    return (
        <div className='basicContainer'>
            <div className='containData'>
                <h2>Antecedentes patológicos</h2>
                <Form form={form3} requiredMark={false} onFinish={updatePathological}>

                    <Form.Item
                        name='padecesEnfermedad'
                        label='¿Padeces alguna enfermedad?'
                        className='lb-padecesEnfer'
                        rules={[Rules.basicSpanish]}>
                        <Checkbox value="diabetesT2">Diabetes tipo 2</Checkbox>
                        <Checkbox value="diabetesT2">Hipertensión arterial </Checkbox>
                        <Checkbox value="diabetesT2">Triglicéridos elevados </Checkbox>
                        <Checkbox value="diabetesT2">Colesterol elevado </Checkbox>
                        <Checkbox value="diabetesT2">Colitis nerviosa</Checkbox>
                        <Checkbox value="diabetesT2">Gastritis </Checkbox>
                        <Checkbox value="diabetesT2">Cáncer</Checkbox>
                        <Checkbox value="diabetesT2">Hipotiroidismo</Checkbox>
                        <Checkbox value="diabetesT2">Hipertiroidismo</Checkbox>
                        <Checkbox value="diabetesT2">Artritis reumatoide</Checkbox>
                        <Checkbox value="diabetesT2">Insuficiencia Renal Crónica</Checkbox>
                        <Checkbox value="diabetesT2">Cardiopatía</Checkbox>
                        <Checkbox value="diabetesT2">Depresión</Checkbox>
                        <label>Otra: </label> <input type="text" />
                    </Form.Item>
                    <h2>Antecedentes heredofamiliares</h2>
                    <Form.Item
                        name='cubresTuPiel'
                        label='¿Cubres tu piel con ropa de manga larga, pantalón, gorra o sombrero?'
                        className='lb-expoSolSelect'
                        rules={[Rules.basicSpanish]}>
                        <Select defaultValue={''}>
                            <Option value={'Siempre'}>Siempre</Option>
                            <Option value={'A veces'}>A veces</Option>
                            <Option value={'Nunca'}>Nunca</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='bloqueadorSolar'
                        label='¿Utilizas bloqueador solar?'
                        className='lb-expoSolSelect'
                    /*rules={[Rules.basicSpanish]}*/
                    >
                        <Select
                            onChange={(value) => setExpoSolCheckBloSolar(value === 'No' ? true : false)}
                            defaultValue={'No'}>
                            <Option value={'Si'}>Si</Option>
                            <Option value={'No'}>No</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label='¿Cuántos días a la semana?'
                        name='diasXsemana'
                        className='lb-expoSolSelect'
                    /*
                    rules={[
                        Rules.basicSpanish,
                    ]}*/
                    >
                        <Select disabled={ExpoSolChecBloSolar} defaultValue={''}>
                            <Option value={'1'}>1</Option>
                            <Option value={'2'}>2</Option>
                            <Option value={'3'}>3</Option>
                            <Option value={'4'}>4</Option>
                            <Option value={'5'}>5</Option>
                            <Option value={'6'}>6</Option>
                            <Option value={'7'}>7</Option>
                        </Select>
                    </Form.Item>

                    <center>
                        <button
                            className='btn-see-circunferencia'
                            htmlType='submit'
                            /*onClick={() => updateEstadoGeneral()}*/
                            value='Add'>
                            Guardar
                        </button>
                    </center>
                </Form>
            </div>
        </div>
    );

};

export default SolarExposition;