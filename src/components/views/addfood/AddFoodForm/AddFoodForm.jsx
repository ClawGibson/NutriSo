import React, { useState } from 'react';
import { Form, Input, Button, Select, Row, Col, Card, InputNumber } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import { getSku } from '@/services';
import UploadImgs from '@/components/commons/UploadImgs';
import InputTags from '@/components/commons/InputTags';
import mocks from '@/mocks/alimentos';
import { Rules } from '@/utils/formRules';

import './AddFoodForm.scss';

const AddFoodForm = () => {
    const { TextArea } = Input;
    const { Option } = Select;

    const [form] = Form.useForm();
    const [url, setUrl] = useState('');
    const [foodOptions, setFoodOptions] = useState([]);

    const afterG = '(g)';
    const afterMG = '(mg)';
    const afterUG = '(µg)';
    const afterUG_RE = '(µg RE)';
    const afterKCAL = '(kcal)';

    const selectAddOnAfter = (
        <Select defaultValue='g'>
            <Option value='g'>{afterG}</Option>
            <Option value='mg'>{afterMG}</Option>
            <Option value='ug'>{afterUG}</Option>
            <Option value='ug_re'>{afterUG_RE}</Option>
            <Option value='kcal'>{afterKCAL}</Option>
        </Select>
    );

    const handleRemoveTag = (tag) => {
        console.log(tag);
        const newState = foodOptions.filter((elem) => {
            const normalizedElem = elem.toLowerCase().trim();
            const normalizedTag = tag.toLowerCase().trim();

            if (normalizedElem !== normalizedTag) return true;

            return false;
        });

        setFoodOptions(newState);
    };

    const handleUploadImg = (values) => {
        setUrl(values?.url);
    };

    const onFinish = async (values) => {
        const sku = await getSku();
        //console.log(sku+1) //Sumar uno porque es un alimento nuevo
        //console.log('Received values of form: ', values);
        //console.log(foodOptions)

        const data = {
            sku: sku + 1,
            nombreAlimento: values.nombre,
            grupoExportable: values.grupoExp,
            subGrupoExportable: values.subGrupoExp,
            mensaje: {
                nutricional: values.mensajeNutricional,
                ambiental: values.mensajeAmbiental,
                mensajeEconomia: values.mensajeEconomico,
                mensajeCulturaSociedad: values.mensajeCultural,
            },
            icono: {
                iconoNutricional: values.iconoNutricional,
                iconoAmbiental: values.iconoAmbiental,
                iconoEconomia: values.iconoEconomia,
                iconoCulturaSociedad: values.iconoCultura,
            },
            imagen: values.image,
            clasificacionExportable: values.clasificacionExp,
            opcionesPreparacion: foodOptions, //El values no contiene esto
            cantidadAlimento: {
                cantidadSugerida: values.cantidadSugerida,
                unidad: values.unidad,
                pesoNeto: values.neto, //Este hacía falta
            },
            caloriasMacronutrientes: {
                energia: values.energiamacro,
                proteina: values.proteinamacro,
                lipidos: values.lipidosmacro,
                agSaturados: values.saturadasmacro,
                agMonoinsaturados: values.monoinsaturadosmacro,
                adPoliinsaturados: values.adpoliinsaturadosmacro,
                colesterol: values.colestrerolmacro,
                omega3: values.omega3macro,
                omega6: values.omega6macro,
                omega9: values.omega9,
                hidratosDeCarbono: values.hidratosCarbonomacro,
                fibra: values.fibramacro,
                fibraInsoluble: values.fibrainsolublemacro,
                fibraSoluble: values.fibrasolublemacro,
                azucar: values.azucarmacro,
                etanol: values.etanolmacro,
            },
            vitaminas: {
                tiamina: values.tiamina,
                riboflavin: values.riboflavin,
                niacina: values.niacina,
                acidoPantotenico: values.acidoPantotenico,
                piridoxina: values.piridoxina,
                biotina: values.biotina,
                cobalmina: values.cobalmina,
                acidoAscorbico: values.acidoAscorbico,
                acidoFolico: values.acidoFolico,
                vitaminaA: values.vitaminaA,
                vitaminaD: values.vitaminaD,
                vitaminaK: values.vitaminaK,
                vitaminaE: values.vitaminaE,
            },
            minerales: {
                calcio: values.calcio,
                fosforo: values.fosforo1,
                hierro: values.hierro,
                hierroNoHem: values.hierroNoHem,
                hierroTotal: values.hierroTotal,
                magnesio: values.magnesio,
                sodio: values.sodio,
                potasio: values.potasio,
                zinc: values.zinc,
                selenio: values.selenio,
            },
            aspectoGlucemico: {
                indiceGlicemico: values.indiceGlucemico,
                cargaGlicemica: values.cargaGlucemica,
            },
            aspectoMedioambiental: {
                factorDeCorreccionParaHuellaHidricaYEGEI: values.factorCoreccion,
                tipo: values.tipoma,
                lugar: values.lugarma,
                huellaHidricaTotal: values.huellaHidricaTotal,
                huellaHidricaVerde: values.huellaHidricaVerde,
                huellaHidricaAzul: values.huellaHidricaAzul,
                huellaHidricaGris: values.huellaHidricaGris,
                aguaParaLavado: values.aguaParaLavado,
                aguaParaCoccion: values.aguaParaCoccion,
                lugarEGEI: values.lugarEGEI,
                citaEGEI: values.citaEGEI,
                huellaCarbono: values.huellaCarbono,
                huellaEcologica: values.huellaEcologica,
                usoDeSuelo: values.usoSuelo, //Se agregó este campo que no existia
                energiaFosil: values.energiaFosil,
                nitrogeno: values.nitrogeno,
                fosforo: values.fosforo2, //¿Debemos cambiarlo a otro fósforo o usamos el mismo que de minerales?
                puntajeEcologico: values.puntajeEcologico,
            },
            aspectoEconomico: {
                precio: values.precio,
                lugarDeCompra: values.lugarCompra,
                lugarDeVenta: values.lugarVenta,
            },
            componentesBioactivos: {
                fitoquimicos: values.fitoquimicos,
                polifenoles: values.polifenoles,
                antocianinas: values.antocianinas,
                taninos: values.taninos,
                isoflavonas: values.isoflavonas,
                resveratrol: values.resveraterol,
                isotiocinatos: values.isotiocinatos,
                caretenoides: values.caretenoides,
                betacarotenos: values.betacarotenos,
                licopeno: values.licopeno,
                luteina: values.luteina,
                alicina: values.alicina,
                cafeina: values.cafeina,
                UFC: values.UFC,
            },
            aditivosAlimentarios: {
                benzoatoDeSodio: values.benzoatoDeSodio,
                polisorbato: values.polisorbato,
                azulBrillanteFCFoE133: values.azulBrillanteFCFoE133,
                azurrubinaOE102: values.azurrubinaOE102,
                amarilloOcasoFDFoE110: values.amarilloOcasoFDFoE110,
                tartrazinaOE102: values.tartrazinaOE102,
                verdeSoE142: values.verdeSoE142,
                negroBrillanteBNoE151: values.negroBrillanteBNoE151,
                sucralosa: values.sucralosa,
                estevia: values.estevia,
                sacarina: values.sacarina,
                aspartame: values.aspartame,
                acesulfameK: values.acesulfameK,
                carboxymethylcellulose: values.carboxymethylcellulose,
                dioxidoDeTitanio: values.dioxidoDeTitanio,
                monolauratoDeGlicerol: values.monolauratoDeGlicerol,
            },
            /*atributosAdicionales: [
                {
                    atributoAdicional: `${rowValues[109] ?? 'N/A'}`,
                },
            ],*/
            marca: values.marca,
        };
        console.log(data);
    };

    return (
        <Form
            scrollToFirstError
            className={'addFoodFormContainer'}
            form={form}
            layout='vertical'
            onFinish={onFinish}
            requiredMark={false}>
            <Row >
                <Col span={12}>
                    <Form.Item
                        hasFeedback
                        name={'nombre'}
                        label={<label className={'formItem'}>Nombre</label>}
                        rules={[Rules.basicSpanish]}>
                        <Input placeholder='Ingrese el nombre del alimento' />
                    </Form.Item>
                </Col>
                <Col span={8} offset={2}>
                    <Form.Item
                        name='image'
                        wrapperCol={{ sm: 24 }}
                        label={<label className={'formItem'}>Imagen</label>}
                        tooltip={{
                            title: 'Seleccione una imagen del alimento',
                            icon: <InfoCircleOutlined />,
                        }}>
                        <UploadImgs onChange={handleUploadImg} />
                    </Form.Item>
                </Col>
            </Row>
            <Card className='cards' title='Íconos'>
                <Row>
                    <Col span={12}>
                        <Form.Item
                            name={'iconoNutricional'}
                            label={<label className={'formItem'}>Ícono nutricional</label>}
                            rules={[Rules.basicSpanish]}
                            tooltip={{
                                title: 'Seleccione el ícono nutricional',
                                icon: <InfoCircleOutlined />,
                            }}>
                            <Select defaultValue='1' className={'selectItem'}>
                                {mocks.iconos.map((elem, index) => (
                                    <Option key={index} value={elem.value}>
                                        {elem.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={'iconoAmbiental'}
                            wrapperCol={{ sm: 24 }}
                            label={<label className={'formItem'}>Ícono ambiental</label>}
                            rules={[Rules.basicSpanish]}
                            tooltip={{
                                title: 'Seleccione el ícono ambiental',
                                icon: <InfoCircleOutlined />,
                            }}>
                            <Select defaultValue='1' className={'selectItem'}>
                                {mocks.iconos.map((elem, index) => (
                                    <Option key={index} value={elem.value}>
                                        {elem.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <Form.Item
                            name={'iconoEconomia'}
                            wrapperCol={{ sm: 24 }}
                            label={<label className={'formItem'}>Ícono economía</label>}
                            rules={[Rules.basicSpanish]}
                            tooltip={{
                                title: 'Seleccione el ícono de economía',
                                icon: <InfoCircleOutlined />,
                            }}>
                            <Select defaultValue='1' className={'selectItem'}>
                                {mocks.iconos.map((elem, index) => (
                                    <Option key={index} value={elem.value}>
                                        {elem.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name={'iconoCultura'}
                            wrapperCol={{ sm: 24 }}
                            label={
                                <label className={'formItem'}>
                                    Ícono de cultura sociedad
                                </label>
                            }
                            rules={[Rules.basicSpanish]}
                            tooltip={{
                                title: 'Seleccione el ícono de cultura sociedad',
                                icon: <InfoCircleOutlined />,
                            }}>
                            <Select defaultValue='1' className={'selectItem'}>
                                {mocks.iconos.map((elem, index) => (
                                    <Option key={index} value={elem.value}>
                                        {elem.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
            <Card className='cards' title='Cantidad de alimento'>
                <Row gutter={[8, 8]}>
                    <Col span={12}>
                        <Form.Item
                            name={'cantidadSugerida'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Cantidad sugerida</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={selectAddOnAfter}
                                placeholder='Ingrese la unidad'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={'unidad'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Unidad</label>}>
                            <Select placeholder='Selecciona una unidad'>
                                {mocks.unidadesRecomendadas.map((elem) => (
                                    <Option key={elem.id} value={elem.value}>
                                        {elem.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Form.Item
                        name={'neto'}
                        rules={[Rules.basicSpanish]}
                        label={<label className={'formItem'}>Peso neto</label>}>
                        <InputNumber
                            addonAfter={afterG}
                            type='number'
                            placeholder='Ingrese el peso neto'
                        />
                    </Form.Item>
                </Row>
            </Card>
            <Form.Item
                name={'grupoExp'}
                label={<label className={'formItem'}>Grupo exportable</label>}
                rules={[Rules.basicSpanish]}>
                <Input placeholder='Ingrese el grupo exportable' />
            </Form.Item>
            <Form.Item
                name={'subGrupoExp'}
                rules={[Rules.basicSpanish]}
                label={<label className={'formItem'}>Sub grupo exportable</label>}>
                <Input placeholder='Ingrese el grupo sub exportable' />
            </Form.Item>
            <Form.Item
                name={'clasificacionExp'}
                rules={[Rules.basicSpanish]}
                label={<label className={'formItem'}>Clasificación exportable</label>}>
                <Input placeholder='Ingrese la clasificación exportable' />
            </Form.Item>
            <Form.Item
                name={'grupoAlimentos'}
                label={<label className={'formItem'}>Grupo de alimento</label>}
                rules={[Rules.basicSpanish]}>
                <Select placeholder='Selecciona un grupo'>
                    {mocks.gruposAlimento.map((elem) => (
                        <Option key={elem.id} value={elem.label}>
                            {elem.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name={'mensajeNutricional'}
                rules={[Rules.basicSpanish]}
                label={<label className={'formItem'}>Mensaje nutricional </label>}>
                <TextArea rows={2} placeholder='Ingrese el mensaje' />
            </Form.Item>
            <Form.Item
                name={'mensajeAmbiental'}
                rules={[Rules.basicSpanish]}
                label={<label className={'formItem'}>Mensaje ambiental</label>}>
                <TextArea rows={2} placeholder='Ingrese el mensaje' />
            </Form.Item>
            <Form.Item
                name={'mensajeEconomico'}
                rules={[Rules.basicSpanish]}
                label={<label className={'formItem'}>Mensaje económico</label>}>
                <TextArea rows={2} placeholder='Ingrese el mensaje' />
            </Form.Item>
            <Form.Item
                name={'mensajeCultural'}
                rules={[Rules.basicSpanish]}
                label={<label className={'formItem'}>Mensaje cultural</label>}>
                <TextArea rows={2} placeholder='Ingrese el mensaje' />
            </Form.Item>
            <Form.Item
                name={'preparacion'}
                label={<label className={'formItem'}>Opciones de preparación</label>}>
                <InputTags
                    source={foodOptions}
                    onUpdateOptions={setFoodOptions}
                    onRemoveTag={handleRemoveTag}
                />
            </Form.Item>

            <Form.Item
                name={'calorias'}
                rules={[Rules.basicSpanish]}
                label={<label className={'formItem'}>Calorías de alimentos</label>}>
                <Select defaultValue='1' className={'selectItem'}>
                    {Array.from({ length: 15 }).map((_, index) => (
                        <option value={index} key={index}>
                            {index}
                        </option>
                    ))}
                </Select>
            </Form.Item>
            <Card className='cards' title='Calorías macronutrientes'>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'energiamacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Energía</label>}>
                            <InputNumber
                                addonAfter={afterKCAL}
                                type='number'
                                placeholder='Ingrese la cantidad de energía'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'proteinamacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Proteína</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de proteína'
                            />
                        </Form.Item>
                    </Col>
                    {/* </Row>

                <Row gutter={[8, 8]}> */}
                    <Col span={8}>
                        <Form.Item
                            name={'saturadasmacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>AG Saturados</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de grasas saturadas'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'monoinsaturadosmacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>AG Monoinsaturados</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de grasas monoinsaturados'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'adpoliinsaturadosmacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>AG Poliinsaturadas</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de poliinsaturadas'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'lipidosmacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Lípidos</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de lipidos'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'colestrerolmacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Colesterol</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de colesterol'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'omega3macro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Omega 3</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de omega3'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'omega6macro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Omega6</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de omega6'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>  
                    <Col span={8}>
                        <Form.Item
                            name={'omega9'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Omega9</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de omega9'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'hidratosCarbonomacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Hidratos de Carbono</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de hidratos de carbono'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'fibramacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Fibra</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de fibra'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'fibrasolublemacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Fibra soluble</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de fibra soluble'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'fibrainsolublemacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Fibra insoluble</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de fibra insoluble'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'azucarmacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Azúcar</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de azúcar'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'etanolmacro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Etanol</label>}>
                            <InputNumber
                                addonAfter={afterG}
                                type='number'
                                placeholder='Ingrese la cantidad de etanol'
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
            <Card className='cards' title='Minerales'>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'calcio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Calcio</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de calcio'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'fosforo1'} //Este es el primer fósforo
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Fósforo</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de fosforo'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'hierro'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Hierro</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de hierro '
                            />
                        </Form.Item>
                    </Col>

                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'hierroNoHem'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Hierro No Hem</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de hierro no hem '
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'hierroTotal'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Hierro total</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de hierroTotal '
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'magnesio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Magnesio</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de magnesio'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                <Col span={8}>
                        <Form.Item
                            name={'sodio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Sodio</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de sodio'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'potasio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Potasio</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de potasio'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'zinc'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Zinc</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de zinc'
                            />
                        </Form.Item>
                    </Col>
                    
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'selenio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Selenio</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de selenio'
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
            <Card className='cards' title='Vitaminas'>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'tiamina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Tiamina</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de tiamina'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'riboflavin'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Riboflavin</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de riboflavin'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'niacina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Niacina</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de niacina '
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'acidoPantotenico'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Ácido pantotenico</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de ácido pantotenico'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'piridoxina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Piridoxina</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de piridoxina'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'biotina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Biotina</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de biotina'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'cobalmina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Cobalmina</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de cobalmina'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'acidoAscorbico'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Ácido ascorbico</label>}>
                            <InputNumber
                                addonAfter={afterMG}
                                type='number'
                                placeholder='Ingrese la cantidad de ácido ascorbico'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'acidoFolico'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Ácido folico</label>}>
                            <InputNumber
                                addonAfter={afterUG}
                                type='number'
                                placeholder='Ingrese la cantidad de ácido folico'
                            />
                        </Form.Item>
                    </Col>

                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'vitaminaA'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Vitamina A</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterUG_RE}
                                placeholder='Ingrese la cantidad de vitamina A'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'vitaminaD'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Vitamina D</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterUG_RE}
                                placeholder='Ingrese la cantidad de vitamina D'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'vitaminaK'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>vitamina K</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de vitamina K'
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'vitaminaE'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Vitamina E</label>}>
                            <InputNumber
                                type='number'
                                addonAfter={afterMG}
                                placeholder='Ingrese la cantidad de vitamina E'
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
            <Card className='cards' title='Aspecto glucemico'>
                <Row gutter={[8, 8]}>
                    <Col span={12}>
                        <Form.Item
                            name={'indiceGlucemico'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Índice glucémico</label>}>
                            <Input placeholder='Ingrese el índice glucémico' />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name={'cargaGlucemica'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Carga glucémica</label>}>
                            <Input placeholder='Ingrese la carga glucemica' />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/*ASPECTO MEDIOAMBIENTAL*/}
            <Card className='cards' title='Aspecto medioambiental'>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'factorCoreccion'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>
                                    Factor de corrección para huella
                                </label>
                            }>
                            <Input
                                type='number'
                                placeholder='Ingrese el factor de corrección para la huella hídrica YEGEI'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'tipoma'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Tipo</label>}>
                            <Input placeholder='Ingrese el tipo' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'lugarma'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Lugar</label>}>
                            <Input placeholder='Ingrese el lugar' />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[8, 8]}>
                    <Col span={8}>
                        <Form.Item
                            name={'huellaHidricaTotal'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>Huella hídrica total</label>
                            }>
                            <Input
                                type='number'
                                placeholder='Ingrese la huella hidrica total'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'huellaHidricaVerde'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>HUella hidrica verde</label>
                            }>
                            <Input placeholder='Ingrese la huella hidrica verde' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'huellaHidricaAzul'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>HUella hidrica azul</label>}>
                            <Input placeholder='Ingrese la huella hidrica azul' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[8, 8]}>
                    <Col span={8}>
                        <Form.Item
                            name={'huellaHidricaGris'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Huella hídrica gris</label>}>
                            <Input
                                type='number'
                                placeholder='Ingrese la huella hidrica gris'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'aguaParaLavado'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>Huella hidrica verde</label>
                            }>
                            <Input placeholder='Ingrese la huella hidrica verde' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'aguaParaCoccion'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Agua para coccion</label>}>
                            <Input placeholder='Ingrese la cantidad de agua para coccion' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[8, 8]}>
                    <Col span={8}>
                        <Form.Item
                            name={'lugarEGEI'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Lugar EGEI</label>}>
                            <Input type='number' placeholder='Ingrese el lugar EGEI' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'citaEGEI'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>CIta EGEI</label>}>
                            <Input placeholder='Ingrese la cita EGEI' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'huellaCarbono'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Huella carbono</label>}>
                            <Input placeholder='Ingrese la huella carbono' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[8, 8]}>
                    <Col span={8}>
                        <Form.Item
                            name={'huellaEcologica'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Huela ecológica</label>}>
                            <Input type='number' placeholder='Ingrese la huella ecológica' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'energiaFosil'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Energía fosil</label>}>
                            <Input placeholder='Ingrese la energía fósil' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'usoSuelo'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Uso de suelo</label>}>
                            <Input placeholder='Ingrese el uso de suelo' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'nitrogeno'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Nitrogeno</label>}>
                            <Input placeholder='Ingrese la cantidad de nitrógeno' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'fosforo2'} //Este fósforo ya existe
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Fósforo</label>}>
                            <Input placeholder='Ingrese la cantidad de fósforo' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'puntajeEcologico'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Puntaje ecológico</label>}>
                            <Input type='number' placeholder='Ingrese el puntaje ecológico' />
                        </Form.Item>
                    </Col>
                </Row>
                
            </Card>
            <Card className='cards' title='Aspecto económico'>
                <Row gutter={[8, 8]}>
                    <Col span={8}>
                        <Form.Item
                            name={'precio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Precio</label>}>
                            <InputNumber
                                addonAfter='MXN'
                                decimalSeparator='.'
                                type='number'
                                prefix='$'
                                placeholder='Ingrese el precio'
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'lugarCompra'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Lugar de compra</label>}>
                            <Select placeholder='Selecciona una opción'>
                                {mocks.lugares.map((elem) => (
                                    <Option key={elem.id} value={elem.label}>
                                        {elem.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'lugarVenta'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Lugar de venta</label>}>
                            <Select placeholder='Selecciona una opción'>
                                {mocks.lugares.map((elem) => (
                                    <Option key={elem.id} value={elem.label}>
                                        {elem.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/*COMPONENTES BIOACTIVOS*/}
            <Card className='cards' title='Componentes Bioactivos'>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'fitoquimicos'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Fitoquímicos</label>}>
                            <Input placeholder='Ingrese los fitoquimicos' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'polifenoles'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Polifenos</label>}>
                            <Input placeholder='Ingrese los polifenos' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'antocianinas'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Antocianinas</label>}>
                            <Input placeholder='Ingrese las antocianinas ' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    

                    <Col span={8}>
                        <Form.Item
                            name={'taninos'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Taninos</label>}>
                            <Input placeholder='Ingrese los tianinos' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'isoflavonas'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Isoflavonas</label>}>
                            <Input placeholder='Ingrese las insoflavonas' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'resveraterol'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Resveratrol</label>}>
                            <Input placeholder='Ingrese la cantidad de resveratrol' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                <Col span={8}>
                        <Form.Item
                            name={'isotiocinatos'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Isotiocinatos</label>}>
                            <Input placeholder='Ingrese la cantidad de isotiocinatos' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'caretenoides'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Caretenoides</label>}>
                            <Input placeholder='Ingrese la cantidad de caretenoides' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'betacarotenos'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Betacarotenos</label>}>
                            <Input placeholder='Ingrese la cantidad de betacarotenos' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'licopeno'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Licopeno</label>}>
                            <Input placeholder='Ingrese la cantidad de licopeno' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'luteina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Luteina</label>}>
                            <Input placeholder='Ingrese la cantidad de luteina' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'alicina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Alicina</label>}>
                            <Input placeholder='Ingrese la cantidad de Alicina' />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'cafeina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Cafeína</label>}>
                            <Input placeholder='Ingrese la cantidad de Cafeína' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'UFC'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>UFC</label>}>
                            <Input placeholder='Ingrese UFC' />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/*ADITIVOS ALIMENTARIOS*/}
            <Card className='cards' title='Aditivos alimentarios'>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'benzoatoDeSodio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Benzoato de sodio</label>}>
                            <Input placeholder='Ingrese Benzoato de sodio' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'polisorbato'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Polisorbato</label>}>
                            <Input placeholder='Ingrese polisorbato' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'azulBrillanteFCFoE133'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>Azul Brillante FCFoE133</label>
                            }>
                            <Input placeholder='Ingrese azulBrillanteFCFoE133 ' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'azurrubinaOE102'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>AzurrubinaOE102</label>}>
                            <Input placeholder='Ingrese azurrubinaOE102' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'amarilloOcasoFDFoE110'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>Amarillo OcasoFDFoE110</label>
                            }>
                            <Input placeholder='Ingrese amarilloOcasoFDFoE110' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'tartrazinaOE102'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Tartrazina OE102</label>}>
                            <Input placeholder='Ingrese tartrazinaOE102 ' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'verdeSoE142'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Verde SoE142</label>}>
                            <Input placeholder='Ingrese verdeSoE142' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'negroBrillanteBNoE151'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>Negro Brillante BNoE151</label>
                            }>
                            <Input placeholder='Ingrese negroBrillanteBNoE151' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'sucralosa'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>sucralosa</label>}>
                            <Input placeholder='Ingrese sucralosa' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'estevia'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Estevia</label>}>
                            <Input placeholder='Ingrese la cantidad de estevia' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'sacarina'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Sacarina</label>}>
                            <Input placeholder='Ingrese la cantidad de sacarina' />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={'aspartame'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Aspartame</label>}>
                            <Input placeholder='Ingrese la cantidad de aspartame' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'acesulfameK'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>AcesulfameK</label>}>
                            <Input placeholder='Ingrese la cantidad de acesulfameK' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'carboxymethylcellulose'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>Carboxymethylcellulose</label>
                            }>
                            <Input placeholder='Ingrese carboxymethylcellulose' />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name={'dioxidoDeTitanio'}
                            rules={[Rules.basicSpanish]}
                            label={<label className={'formItem'}>Dióxido De Titanio</label>}>
                            <Input placeholder='Ingrese la cantidad de dioxidoDeTitanio' />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name={'monolauratoDeGlicerol'}
                            rules={[Rules.basicSpanish]}
                            label={
                                <label className={'formItem'}>Monolaurato De Glicerol</label>
                            }>
                            <Input placeholder='Ingrese monolauratoDeGlicerol' />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
            <Card className='cards' title='Marca'>
                <Row gutter={[8, 8]}>
                    <Col span={24}>
                        <Form.Item
                            name={'marca'}
                            >
                            <Input placeholder='Ingrese la marca' />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
            {/* ATRIBUTOS ADICIONALES 
            <Card className='cards' title="Atributos adicionales">
                <Row gutter={[8, 8]}>
                    <Col span={24}>
                        <Form.Item
                            name={"atributoadicional"}
                            label={
                                <label className={'formItem'}>
                                    Atributo adicional
                                </label>
                            }
                            >
                            <Input placeholder='Ingrese el atributo adicional' />
                        </Form.Item>
                    </Col>                    
                </Row>
            </Card>            
            */}
            <Form.Item>
                <Button type='primary' htmlType='submit'>
                    Submit
                </Button>
            </Form.Item>
        </Form>
    );
};

export default AddFoodForm;

// const data = {
//     sku: sku,
//     nombreAlimento: `${rowValues[1] ?? 'N/A'}`,
//     grupoExportable: `${rowValues[2] ?? 'N/A'}`,
//     subGrupoExportable: `${rowValues[3] ?? 'N/A'}`,
//     grupoAlimento: `${rowValues[4] ?? 'N/A'}`,
//     mensaje: {
//         nutricional: `${rowValues[5] ?? 'N/A'}`,
//         ambiental: `${rowValues[6] ?? 'N/A'}`,
//         mensajeEconomia: `${rowValues[7] ?? 'N/A'}`,
//         mensajeCulturaSociedad: `${rowValues[8] ?? 'N/A'}`,
//     },

//     icono: {
//         iconoNutricional: `${rowValues[9] ?? '4'}`,
//         iconoAmbiental: `${rowValues[10] ?? '4'}`,
//         iconoEconomia: `${rowValues[11] ?? '4'}`,
//         iconoCulturaSociedad: `${rowValues[12] ?? '4'}`,
//     },
//     imagen: url,
//     clasificacionExportable: `${rowValues[14] ?? 'N/A'}`,
//     opcionesPreparacion: opciones,
//     cantidadAlimento: {
//         cantidadSugerida: rowValues[16] ?? 0,
//         unidad: `${rowValues[17] ?? 'N/A'}`,
//         pesoNeto: `${rowValues[18] ?? '0'}`,
//     },
//     caloriasMacronutrientes: {
//         energia: `${rowValues[19] ?? '0'}`,
//         proteina: `${rowValues[20] ?? '0'}`,
//         lipidos: `${rowValues[21] ?? '0'}`,
//         agSaturados: `${rowValues[22] ?? '0'}`,
//         agMonoinsaturados: `${rowValues[23] ?? '0'}`,
//         adPoliinsaturados: `${rowValues[24] ?? '0'}`,
//         colesterol: `${rowValues[25] ?? '0'}`,
//         omega3: `${rowValues[26] ?? '0'}`,
//         omega6: `${rowValues[27] ?? '0'}`,
//         omega9: `${rowValues[28] ?? '0'}`,
//         hidratosDeCarbono: `${rowValues[29] ?? '0'}`,
//         fibra: `${rowValues[30] ?? '0'}`,
//         fibraInsoluble: `${rowValues[31] ?? '0'}`,
//         fibraSoluble: `${rowValues[32] ?? '0'}`,
//         azucar: `${rowValues[33] ?? '0'}`,
//         etanol: `${rowValues[34] ?? '0'}`,
//     },
//     vitaminas: {
//         tiamina: `${rowValues[35] ?? '0'}`,
//         riboflavin: `${rowValues[36] ?? '0'}`,
//         niacina: `${rowValues[37] ?? '0'}`,
//         acidoPantotenico: `${rowValues[38] ?? '0'}`,
//         piridoxina: `${rowValues[39] ?? '0'}`,
//         biotina: `${rowValues[40] ?? '0'}`,
//         cobalmina: `${rowValues[41] ?? '0'}`,
//         acidoAscorbico: `${rowValues[42] ?? '0'}`,
//         acidoFolico: `${rowValues[43] ?? '0'}`,
//         vitaminaA: `${rowValues[44] ?? '0'}`,
//         vitaminaD: `${rowValues[45] ?? '0'}`,
//         vitaminaK: `${rowValues[46] ?? '0'}`,
//         vitaminaE: `${rowValues[47] ?? '0'}`,
//     },
//     minerales: {
//         calcio: `${rowValues[48] ?? '0'}`,
//         fosforo: `${rowValues[49] ?? '0'}`,
//         hierro: `${rowValues[50] ?? '0'}`,
//         hierroNoHem: `${rowValues[51] ?? '0'}`,
//         hierroTotal: `${Number(rowValues[50] + rowValues[51]) ?? '0'}`,
//         magnesio: `${rowValues[52] ?? '0'}`,
//         sodio: `${rowValues[53] ?? '0'}`,
//         potasio: `${rowValues[54] ?? '0'}`,
//         zinc: `${rowValues[55] ?? '0'}`,
//         selenio: `${rowValues[56] ?? '0'}`,
//     },
//     aspectoGlucemico: {
//         indiceGlicemico: `${rowValues[57] ?? '0'}`,
//         cargaGlicemica: `${rowValues[58] ?? '0'}`,
//     },
//     aspectoMedioambiental: {
//         factorDeCorreccionParaHuellaHidricaYEGEI: rowValues[59] ?? 0,
//         tipo: `${rowValues[60] ?? 'N/A'}`,
//         lugar: `${rowValues[61] ?? 'N/A'}`,
//         huellaHidricaTotal: `${
//             Number(rowValues[62]) + Number(rowValues[63]) + Number(rowValues[64])
//         }`,
//         huellaHidricaVerde: `${rowValues[62] ?? '0'}`,
//         huellaHidricaAzul: `${rowValues[63] ?? '0'}`,
//         huellaHidricaGris: `${rowValues[64] ?? '0'}`,
//         aguaParaLavado: `${rowValues[65] ?? '0'}`,
//         aguaParaCoccion: `${rowValues[66] ?? '0'}`,
//         lugarEGEI: `${rowValues[67] ?? '0'}`,
//         citaEGEI: `${rowValues[68] ?? '0'}`,
//         huellaCarbono: `${rowValues[69] ?? '0'}`, // EGEI.
//         huellaEcologica: `${rowValues[70] ?? '0'}`,
//         usoDeSuelo: `${rowValues[71] ?? '0'}`,
//         energiaFosil: `${rowValues[72] ?? '0'}`,
//         nitrogeno: `${rowValues[73] ?? '0'}`,
//         fosforo: `${rowValues[74] ?? '0'}`,
//         puntajeEcologico: rowValues[75] ?? 0,
//     },
//     aspectoEconomico: {
//         precio: rowValues[76] ?? 0,
//         lugarDeCompra: `${rowValues[77] ?? 'N/A'}`,
//         lugarDeVenta: `${rowValues[78] ?? 'N/A'}`,
//     },
//     componentesBioactivos: {
//         fitoquimicos: `${rowValues[79] ?? '0'}`,
//         polifenoles: `${rowValues[80] ?? '0'}`,
//         antocianinas: `${rowValues[81] ?? '0'}`,
//         taninos: `${rowValues[82] ?? '0'}`,
//         isoflavonas: `${rowValues[83] ?? '0'}`,
//         resveratrol: `${rowValues[84] ?? '0'}`,
//         isotiocinatos: `${rowValues[85] ?? '0'}`,
//         caretenoides: `${rowValues[86] ?? '0'}`,
//         betacarotenos: `${rowValues[87] ?? '0'}`,
//         licopeno: `${rowValues[88] ?? '0'}`,
//         luteina: `${rowValues[89] ?? '0'}`,
//         alicina: `${rowValues[90] ?? '0'}`,
//         cafeina: `${rowValues[91] ?? '0'}`,
//         UFC: `${rowValues[92] ?? '0'}`,
//     },
//     aditivosAlimentarios: {
//         benzoatoDeSodio: `${rowValues[93] ?? '0'}`,
//         polisorbato: `${rowValues[94] ?? '0'}`,
//         azulBrillanteFCFoE133: `${rowValues[95] ?? '0'}`,
//         azurrubinaOE102: `${rowValues[96] ?? '0'}`,
//         amarilloOcasoFDFoE110: `${rowValues[97] ?? '0'}`,
//         tartrazinaOE102: `${rowValues[98] ?? '0'}`,
//         verdeSoE142: `${rowValues[99] ?? '0'}`,
//         negroBrillanteBNoE151: `${rowValues[100] ?? '0'}`,
//         sucralosa: `${rowValues[101] ?? '0'}`,
//         estevia: `${rowValues[102] ?? '0'}`,
//         sacarina: `${rowValues[103] ?? '0'}`,
//         aspartame: `${rowValues[104] ?? '0'}`,
//         acesulfameK: `${rowValues[105] ?? '0'}`,
//         carboxymethylcellulose: `${rowValues[106] ?? '0'}`,
//         dioxidoDeTitanio: `${rowValues[107] ?? '0'}`,
//         monolauratoDeGlicerol: `${rowValues[108] ?? '0'}`,
//     },
//     atributosAdicionales: [
//         {
//             atributoAdicional: `${rowValues[109] ?? 'N/A'}`,
//         },
//     ],
//     marca: `${rowValues[108] ?? ''}`,
// };
