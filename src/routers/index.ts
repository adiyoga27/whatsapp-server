import { response, Router } from "express";
import { body, validationResult } from "express-validator";
import { whatsappSocket } from "../services/whatsapp";
import { phoneNumberFormatter } from "../helpers/formatter";
import mime from "mime-types";
import url from "url";
import {
  sendMediaSchema,
  sendMessageSchema,
} from "../validations/whatsapp-schema";
const router = Router();

router.get("/", async (req, res) => {
  const id = "085792486889";
  const [result] = await (await whatsappSocket).onWhatsApp(id);
  if (result.exists) {
    res.send("Whatsapp Ada" + result.jid);
  } else {
    res.send("sadsadsad");
  }
});
router.post("/send-message", sendMessageSchema, async (req: any, res: any) => {
  // validate input
  // console.log(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.array()[0]["msg"] ?? "Error Validator !!",
      errors: errors.array(),
    });
  }

  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;
  validateNumberWhatsapp(res, number);
  await (
    await whatsappSocket
  )
    .sendMessage(number, { text: message })
    .then((response) => {
      return res.status(200).json({
        status: true,
        message: "Berhasil Mengirim Pesan",
        response: response,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        status: false,
        message: "Check Whatsapp Anda",
        response: err,
      });
    });
});

router.get("/check-connection", async (req: any, res: any) => {
  // validate input
  // console.log(req);
  const number = phoneNumberFormatter('085792486889');
  const [checkWhatsapp] = await (await whatsappSocket).onWhatsApp(number);
  if (!checkWhatsapp?.exists) {
    return res.status(400).json({
      status: false,
      message: "Nomor ini tidak memiliki whatsapp",
    });
  }
  return res.status(200).json({
    status: true,
    message: "Whatsapp Active",
  });
});

router.post("/send-media", sendMediaSchema, async (req: any, res: any) => {
  // validate input
  // console.log(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.array()[0]["msg"] ?? "Error Validator !!",
      errors: errors.array(),
    });
  }

  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;
  const filetype = req.body.filetype;
  const urlFile = req.body.url;

  validateNumberWhatsapp(res, number);
  let payloadMessage = {};
  if (filetype == "image") {
    await (
      await whatsappSocket
    )
      .sendMessage(number, {
        caption: message,
        image: { url: urlFile },
      })
      .then((response) => {
        return res.status(200).json({
          status: true,
          message: "Berhasil Mengirim Pesan",
          response: response,
        });
      })
      .catch((err) => {
        return res.status(400).json({
          status: false,
          message: "Check Whatsapp Anda",
          response: err,
        });
      });
  } else if (filetype == "video") {
    await (
      await whatsappSocket
    )
      .sendMessage(number, {
        caption: message,
        video: { url: urlFile },
        gifPlayback: true,
      })
      .then((response) => {
        return res.status(200).json({
          status: true,
          message: "Berhasil Mengirim Pesan",
          response: response,
        });
      })
      .catch((err) => {
        return res.json({
          status: false,
          message: "Check Whatsapp Anda",
          response: err,
        });
      });
  } else if (filetype == "audio") {
    await (
      await whatsappSocket
    )
      .sendMessage(number, {
        caption: message,
        audio: { url: urlFile },
        mimetype: "audio/mp4",
      })
      .then((response) => {
        return res.status(200).json({
          status: true,
          message: "Berhasil Mengirim Pesan",
          response: response,
        });
      })
      .catch((err) => {
        return res.json({
          status: false,
          message: "Check Whatsapp Anda",
          response: err,
        });
      });
  } else if (filetype == "file") {
    const parsedUrl = url.parse(urlFile);
    const fileNameWithMime = parsedUrl.pathname?.split("/").pop();
    const fileName = fileNameWithMime?.split(".").shift();
    const mimeType = mime.lookup(fileName!) as string;

    await (
      await whatsappSocket
    )
      .sendMessage(number, {
        caption: message,
        document: {
          url: urlFile,
        },
        mimetype: mimeType,
        fileName: fileName,
      })
      .then((response) => {
        return res.status(200).json({
          status: true,
          message: "Berhasil Mengirim Pesan",
          response: response,
        });
      })
      .catch((err) => {
        return res.json({
          status: false,
          message: "Check Whatsapp Anda",
          response: err,
        });
      });
  } else {
    return res.status(400).json({
      status: false,
      message: "Check your filetype. Filetype is image, video and audio",
    });
  }
});

async function validateNumberWhatsapp(res: any, number: any) {
  const [checkWhatsapp] = await (await whatsappSocket).onWhatsApp(number);
  console.log(checkWhatsapp);
  if (!checkWhatsapp?.exists) {
    return res.status(400).json({
      status: false,
      message: number + "Nomor ini tidak memiliki whatsapp ",
    });
  }
  return true;
}
export default router;
