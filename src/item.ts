import {getUserAccount} from '@decentraland/EthereumController'
import {getParcel, ILand} from "@decentraland/ParcelIdentity";


export default class MetaViuBillboard {
    private videoTexture: any;
    private rotation: any;
    private billboard_id = 1;
    private redirect_url = [];

    init() {
    }

    spawn(host: Entity, channel: IChannel) {
        const sign = new Entity()
        sign.setParent(host)

        this.find_ad(host).then()
        sign.addComponent(new GLTFShape('models/MetaViuTriple.glb'))
        sign.addComponent(new Transform({}))
        sign.addComponent(
            new OnPointerDown(() => {
                    openExternalURL(this.redirect_url[this.billboard_id])
                },
                {
                    hoverText: 'Interact',
                })
        )
    }

    render_content(host: Entity, url, variable, transform: Transform, type) {
        let QRMaterial = new Material()
        QRMaterial.metallic = 0
        QRMaterial.roughness = 1
        QRMaterial.specularIntensity = 0
        if (type != 'image') {
            this.videoTexture = new VideoTexture(new VideoClip(
                url
            ))
            QRMaterial.albedoTexture = this.videoTexture
        } else {
            QRMaterial.albedoTexture = new Texture(url)
        }

        variable = new Entity()
        variable.setParent(host)
        variable.addComponent(new PlaneShape())
        variable.addComponent(QRMaterial)
        variable.addComponent(
            transform
        )
        if (type != 'image') {
            variable.addComponent(
                new OnPointerDown(() => {
                    this.videoTexture.playing = !this.videoTexture.playing
                })
            )
            this.videoTexture.loop = true;
            this.videoTexture.play()
        }

    }


    async find_ad(host: Entity) {

        const userAccount = await getUserAccount()
        const parcel = await getParcel()
        const transform = host.getComponent(Transform)

        let request = {
            width: transform.scale.x,
            height: transform.scale.y,
            billboard_type: 'Triple',
            billboard_id: this.billboard_id,
            type: ['image', 'video'],
            mime_type: ['image/jpeg', 'image/png', 'video/mp4'],
            context: {
                site: {
                    url: 'https://' + this.getSceneId(parcel.land) + '.decentraland.org/',
                },
                user: {
                    account: userAccount,
                },
            },
            vendor: 'Decentraland',
            version: '1.0 Beta',
        }

        let response: any = {}

        try {
            let callUrl = 'https://billboards-api.metaviu.io/show_ad'
            let callResponse = await fetch(callUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',

                },
                method: 'POST',
                body: JSON.stringify(request),
            })
            response = await callResponse.json();
            let position;
            this.redirect_url[this.billboard_id] = response.redirect_url;
            this.rotation = response.content.side_1.type == 'image' ? new Vector3(-360, 0, 295) : Quaternion.Euler(360, 78.65, 0);
            this.render_content(host, response.content.side_1.url, 'side1', new Transform({
                position: new Vector3(2.837, 4.04, 0.34),
                rotation: this.rotation,
                scale: new Vector3(3.54, 2.5, 2)
            }), response.content.side_1.type)

            this.rotation = response.content.side_2.type == 'image' ? new Vector3(26.5, 0, 10) : Quaternion.Euler(360, -41.35, 0);
            this.render_content(host, response.content.side_2.url, 'side2', new Transform({
                position: new Vector3(1.152, 4.04, 0.89),
                rotation: this.rotation,
                scale: new Vector3(3.54, 2.5, 2)
            }), response.content.side_2.type);

            this.rotation = response.content.side_2.type == 'image' ? new Vector3(59, 0, 360) : Quaternion.Euler(360, 198.66, 0);
            this.render_content(host, response.content.side_3.url, 'side3', new Transform({
                position: new Vector3(1.5, 4.04, -0.846),
                rotation: this.rotation,
                scale: new Vector3(3.54, 2.5, 2)
            }), response.content.side_3.type);


        } catch (e) {
            log('failed to reach URL', e)
        }

    }

    getSceneId(land: ILand): string {
        return 'scene-' +
            land.sceneJsonData.scene.base.replace(new RegExp('-', 'g'), 'n')
                .replace(',', '-')
    }
}