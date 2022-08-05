import { Modal, Button } from "react-bootstrap"

export default function ColorPickerModal(props) {
    return <Modal show={props.show} onHide={props.onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Pick a color</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <HexColorPicker color={props.color} onChange={props.onChange} className="w-auto" />
            <HexColorInput color={props.color} onChange={props.onChange} className="w-100 mt-2" />
        </Modal.Body>
        <Modal.Footer>
            <Button variant="primary" onClick={props.onHide}>
                Close
            </Button>
        </Modal.Footer>
    </Modal >
}