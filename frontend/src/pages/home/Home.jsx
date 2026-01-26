import { CButton, CCarousel, CCarouselItem, CCarouselCaption, CImage } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLocationPin, cilMap } from '@coreui/icons'
import { cibGooglePlay, cibApple } from '@coreui/icons'

export default function Home() {
    return (
        <div className="home-page">
            <CCarousel controls indicators className="shadow-lg rounded-4 overflow-hidden">
                
                {/* Slide 1 : Signalement Facile */}
                <CCarouselItem>
                    <CImage
                        className="d-block w-100"
                        src="/assets/img/slide2.png"
                        alt="Routes endommagées"
                        style={{ height: '550px', objectFit: 'cover' }}
                    />
                    <CCarouselCaption className="d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="text-center text-white p-5 bg-dark bg-opacity-50 rounded-4">
                            <h1 className="display-4 fw-bold mb-3">Signalement Facile</h1>
                            <p className="lead mb-4" style={{ maxWidth: '600px' }}>
                                Signalez les routes dégradées ou les obstacles pour améliorer la sécurité de tous.
                            </p>
                            <CButton color="warning" size="lg" className="fw-bold px-5 py-3 shadow">
                                <CIcon icon={cilLocationPin} className="me-2" />
                                SIGNALER UN PROBLEME
                            </CButton>
                        </div>
                    </CCarouselCaption>
                </CCarouselItem>

                {/* Slide 2 : Cartographie Interactive */}
                <CCarouselItem>
                    <CImage
                        className="d-block w-100"
                        src="/assets/img/slide1.png"
                        alt="Cartographie interactive"
                        style={{ height: '550px', objectFit: 'cover' }}
                    />
                    <CCarouselCaption className="d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="p-5 bg-white bg-opacity-90 rounded-4 shadow-lg text-center" style={{ maxWidth: '650px' }}>
                            <div className="mb-3">
                                <CIcon icon={cilMap} size="3xl" className="text-dark" />
                            </div>
                            <h1 className="fw-bold text-navy mb-1 display-7">
                                Cartographie Interactive
                            </h1>
                            <p className="text-muted fs-4">
                                Visualisez tous les signalements sur une carte dynamique et localisez précisément les zones à risque dans tout Madagascar.
                            </p>
                            <CButton color="primary" size="lg" className="fw-bold mt-3 px-5 py-3">
                                VOIR LA CARTE
                            </CButton>
                        </div>
                    </CCarouselCaption>
                </CCarouselItem>

                {/* Slide 3 : Application Mobile */}
                <CCarouselItem>
                    <CImage
                        className="d-block w-100"
                        src="/assets/img/slide3.jpeg"
                        alt="Application mobile"
                        style={{ height: '550px', objectFit: 'cover' }}
                    />
                    <CCarouselCaption className="d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="p-5 bg-white bg-opacity-95 rounded-4 shadow-lg text-center" style={{ maxWidth: '600px' }}>
                            <img 
                                src="/assets/logo/logo.png" 
                                alt="LALANTSIKA" 
                                height="80" 
                                className="mb-3 rounded shadow-sm"
                            />
                            <p className="text-dark fs-4 mb-4">
                                Emportez Lalantsika partout avec vous ! Signalez les problèmes en un clic depuis votre smartphone.
                            </p>
                            <div className="d-flex justify-content-center gap-3">
                                <CButton color="dark" size="lg" className="fw-bold px-4 py-3">
                                    <CIcon icon={cibGooglePlay} className="me-2" size="xl" />
                                    Google Play
                                </CButton>
                                <CButton color="dark" size="lg" className="fw-bold px-4 py-3">
                                    <CIcon icon={cibApple} className="me-2" size="xl" />
                                    App Store
                                </CButton>
                            </div>
                        </div>
                    </CCarouselCaption>
                </CCarouselItem>

            </CCarousel>
        </div>
    )
}
