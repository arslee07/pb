import {
    TransformComponent,
    TransformWrapper,
} from "@pronestor/react-zoom-pan-pinch";

export default function MovementWrapper(props) {
    return <TransformWrapper
        minScale={0.25}
        maxScale={50}
        initialScale={1}
        centerOnInit
        centerZoomedOut
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true }}
    >
        {({ zoomIn, zoomOut, ...rest }) => (
            <div id="paper-wrapper">
                <TransformComponent
                    wrapperClass='position-absolute'
                    contentClass='p-5'
                    wrapperStyle={{
                        width: "100%",
                        maxHeight: "100vh",
                        imageRendering: "pixelated"
                    }}
                >
                    {props.children}
                </TransformComponent>
            </div>
        )}
    </TransformWrapper>
}