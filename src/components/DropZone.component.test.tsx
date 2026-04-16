import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DropZone } from "./DropZone";
import { MAX_IMAGE_BYTES } from "@/lib/validation/image";

function jpegFile(size = 1024, name = "ref.jpg"): File {
  return new File([new Uint8Array(size)], name, { type: "image/jpeg" });
}

describe("DropZone", () => {
  it("renders with an accessible upload control", () => {
    render(<DropZone onFileSelected={() => {}} onError={() => {}} />);
    expect(screen.getByLabelText(/upload a reference image/i)).toBeInTheDocument();
  });

  it("calls onFileSelected when the user picks a valid JPEG", async () => {
    const onFileSelected = vi.fn();
    render(<DropZone onFileSelected={onFileSelected} onError={() => {}} />);

    const input = screen.getByLabelText(/upload a reference image/i);
    await userEvent.upload(input, jpegFile());

    expect(onFileSelected).toHaveBeenCalledTimes(1);
    expect(onFileSelected.mock.calls[0]![0]!.type).toBe("image/jpeg");
  });

  it("rejects a file over the 10 MB cap client-side", async () => {
    const onFileSelected = vi.fn();
    const onError = vi.fn();
    render(<DropZone onFileSelected={onFileSelected} onError={onError} />);

    const tooBig = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    await userEvent.upload(screen.getByLabelText(/upload/i), tooBig);

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/max is 10/i));
  });

  it("rejects an unsupported MIME type client-side", async () => {
    const onError = vi.fn();
    render(<DropZone onFileSelected={() => {}} onError={onError} />);

    // applyAccept:false forces userEvent to skip the `accept=` filter the browser
    // normally applies — we want to test our in-component check too.
    const pdf = new File([new Uint8Array(10)], "doc.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText(/upload/i), pdf, { applyAccept: false });

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/jpeg|png|webp/i));
  });

  it("accepts a file via drag-and-drop", () => {
    const onFileSelected = vi.fn();
    render(<DropZone onFileSelected={onFileSelected} onError={() => {}} />);

    const zone = screen.getByTestId("dropzone");
    fireEvent.drop(zone, {
      dataTransfer: { files: [jpegFile()] },
    });

    expect(onFileSelected).toHaveBeenCalledTimes(1);
  });
});
