import * as faceapi from 'face-api.js';

/**
 * FaceRecognitionService
 * 
 * Serviço de Reconhecimento Facial baseado em face-api.js (TensorFlow.js).
 * 
 * Fluxo:
 * 1. Carrega modelos (TinyFaceDetector + FaceLandmark68Tiny + FaceRecognition)
 * 2. Extrai descriptors faciais (vetores 128D) de imagens
 * 3. Compara descriptors para encontrar correspondências
 * 
 * O descriptor facial é um Float32Array de 128 valores que funciona como
 * uma "impressão digital" única do rosto. Quanto menor a distância euclidiana
 * entre dois descriptors, mais provável que sejam a mesma pessoa.
 */
class FaceRecognitionServiceClass {
    _modelsLoaded = false;
    _loadingPromise = null;

    /**
     * Carrega os modelos necessários para reconhecimento facial.
     * Os modelos são carregados do diretório public/models/
     * Usa singleton pattern para evitar carregar múltiplas vezes.
     */
    async loadModels() {
        if (this._modelsLoaded) return;

        // Evita múltiplas chamadas simultâneas
        if (this._loadingPromise) {
            return this._loadingPromise;
        }

        this._loadingPromise = (async () => {
            try {
                const MODEL_URL = '/models';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);

                this._modelsLoaded = true;
                console.log('[FaceRecognition] Modelos carregados com sucesso.');
            } catch (error) {
                console.error('[FaceRecognition] Erro ao carregar modelos:', error);
                this._loadingPromise = null;
                throw error;
            }
        })();

        return this._loadingPromise;
    }

    /**
     * Extrai o descriptor facial (vetor 128D) de uma imagem.
     * 
     * @param {string|HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} imageSource 
     *   - URL da imagem
     *   - Base64 data URL
     *   - Elemento HTML (img, video, canvas)
     * @returns {Promise<number[]|null>} Array de 128 números (descriptor) ou null se nenhum rosto detectado
     */
    async getDescriptorFromImage(imageSource) {
        await this.loadModels();

        let img;

        if (typeof imageSource === 'string') {
            // URL ou base64 - precisa criar um elemento de imagem
            img = await this._loadImage(imageSource);
        } else {
            img = imageSource;
        }

        try {
            const options = new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
            });

            const detection = await faceapi
                .detectSingleFace(img, options)
                .withFaceLandmarks(true) // true = usar tiny model
                .withFaceDescriptor();

            if (!detection) {
                console.warn('[FaceRecognition] Nenhum rosto detectado na imagem.');
                return null;
            }

            // Converte Float32Array para Array normal para serialização JSON/Firestore
            return Array.from(detection.descriptor);
        } catch (error) {
            console.error('[FaceRecognition] Erro ao extrair descriptor:', error);
            return null;
        }
    }

    /**
     * Extrai o descriptor facial de um File (captura da câmera).
     * 
     * @param {File} file - Arquivo de imagem capturado pela câmera
     * @returns {Promise<number[]|null>} Descriptor ou null
     */
    async getDescriptorFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const descriptor = await this.getDescriptorFromImage(reader.result);
                    resolve(descriptor);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Encontra o melhor match entre um descriptor de consulta e uma lista de descriptors rotulados.
     * 
     * @param {number[]} queryDescriptor - Descriptor facial da imagem capturada (128 valores)
     * @param {Array<{id: string, name: string, descriptor: number[], photo?: string}>} labeledDescriptors 
     *   - Lista de clientes com descriptors faciais salvos
     * @param {number} threshold - Distância máxima para considerar um match (padrão: 0.6)
     *   - < 0.4 = Muito confiante (mesma pessoa com certeza)
     *   - 0.4-0.6 = Confiante (provável mesma pessoa)
     *   - > 0.6 = Incerto (provavelmente não é a mesma pessoa)
     * @returns {{id: string, name: string, photo?: string, distance: number, confidence: number}|null}
     */
    findBestMatch(queryDescriptor, labeledDescriptors, threshold = 0.6) {
        if (!queryDescriptor || !labeledDescriptors || labeledDescriptors.length === 0) {
            return null;
        }

        const queryFloat32 = new Float32Array(queryDescriptor);

        let bestMatch = null;
        let bestDistance = Infinity;

        for (const labeled of labeledDescriptors) {
            if (!labeled.descriptor || labeled.descriptor.length !== 128) continue;

            const refFloat32 = new Float32Array(labeled.descriptor);
            const distance = faceapi.euclideanDistance(queryFloat32, refFloat32);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = labeled;
            }
        }

        if (bestMatch && bestDistance <= threshold) {
            // Calcula a confiança como percentual inverso da distância
            const confidence = Math.round((1 - bestDistance) * 100);
            return {
                id: bestMatch.id,
                name: bestMatch.name,
                photo: bestMatch.photo,
                distance: bestDistance,
                confidence
            };
        }

        return null;
    }

    /**
     * Verifica se os modelos estão carregados.
     */
    isReady() {
        return this._modelsLoaded;
    }

    /**
     * Carrega uma imagem de uma URL ou base64 e retorna um HTMLImageElement.
     * @private
     */
    async _loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Falha ao carregar imagem: ${err}`));
            img.src = src;
        });
    }
}

export const FaceRecognitionService = new FaceRecognitionServiceClass();
