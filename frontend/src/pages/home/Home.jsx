import { CCarousel, CCarouselCaption, CCarouselItem, CImage, CButton } from '@coreui/react'
import { Parallax } from 'react-parallax'

export default function Home() {
    return (
        <div>
            <CCarousel controls indicators dark className="shadow-lg rounded-3 overflow-hidden">
                <CCarouselItem>
                    <CImage
                        className="d-block w-100"
                        src="/assets/img/slide1.png"
                        alt="Cartographie interactive"
                        style={{ height: '500px', objectFit: 'cover' }}
                    />
                    <CCarouselCaption className="d-none d-md-block bg-dark bg-opacity-50 rounded p-3">
                        <h5 className="text-white">Cartographie Interactive</h5>
                        <p>Visualisez tous les signalements sur une carte Leaflet dynamique et localisez précisément les zones à risque.</p>
                    </CCarouselCaption>
                </CCarouselItem>

                <CCarouselItem>
                    <CImage
                        className="d-block w-100"
                        src="/assets/img/slide2.png"
                        alt="Routes endommagées"
                        style={{ height: '500px', objectFit: 'cover' }}
                    />
                    <CCarouselCaption className="d-none d-md-block bg-dark bg-opacity-50 rounded p-3">
                        <h5 className="text-white">Signalement Facile</h5>
                        <p>Signalez les nids-de-poule, les routes dégradées ou les obstacles pour améliorer la sécurité de tous.</p>
                    </CCarouselCaption>
                </CCarouselItem>

                <CCarouselItem>
                    <CImage
                        className="d-block w-100"
                        src="/assets/img/slide3.jpeg"
                        alt="Téléchargez notre application"
                        style={{ height: '500px', objectFit: 'cover' }}
                    />
                    <CCarouselCaption className="d-none d-md-block bg-dark bg-opacity-50 rounded p-3 text-center">
                        <h5 className="text-white">LALANTSIKA sur Mobile</h5>
                        <p>Emportez Lalantsika partout avec vous ! Signalez les problèmes en un clic depuis votre smartphone.</p>
                        <div className="d-flex justify-content-center gap-2 mt-3">
                            <CButton color="light" size="sm" variant="outline" className="fw-bold">Google Play</CButton>
                            <CButton color="light" size="sm" variant="outline" className="fw-bold">App Store</CButton>
                        </div>
                    </CCarouselCaption>
                </CCarouselItem>
            </CCarousel>

        </div>
    )
}
