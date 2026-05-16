import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Camera, Upload, X, Loader2, AlertTriangle, CheckCircle2,
  Bug, Sparkles, ArrowRight, Info, Wheat, Shield, Sprout, Pill,
  ImageIcon, ChevronDown, AlertCircle, FileText, BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { scansApi } from '../lib/api'
import { usePestData } from '../context/PestDataContext.jsx'

export default function CheckCrops() {
  const navigate = useNavigate()
  const { lookup } = usePestData()
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [warning, setWarning] = useState(null)

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const handleFile = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.type?.startsWith('image/')) {
      toast.error('Please pick an image file')
      return
    }
    if (selectedFile.size > 16 * 1024 * 1024) {
      toast.error('Image must be under 16 MB')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setWarning(null)
  }

  const analyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setWarning(null)
    try {
      const data = await scansApi.scan(file)
      setResult(data)
      if (!data.scan.used_real_model) {
        toast('Using demo predictor (no model loaded)', { icon: 'ℹ️' })
      } else {
        toast.success('Pest identified!')
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.error === 'no_pest_detected') {
        setWarning({
          message: err.response.data.message,
          top_guess: err.response.data.top_guess,
        })
      } else {
        toast.error(err.response?.data?.error || 'Scan failed — try again')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult(null)
    setWarning(null)
  }

  const pestInfo = result ? lookup(result.scan.predicted_class) : null

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Hero header with background image ── */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background image — close-up of crops/leaves */}
        <img
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1400&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-leaf-950/88 via-leaf-900/78 to-leaf-700/55" />

        {/* Header content */}
        <div className="relative z-10 p-8 lg:p-12">
          <p className="text-xs font-semibold text-leaf-300 uppercase tracking-[0.2em]">AI tool</p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-1">
            Check your <em className="text-leaf-300 not-italic">crops</em>
          </h1>

          {/* Welcome message card */}
          <div className="mt-5 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 shadow-lg">
              <p className="text-leaf-100 leading-relaxed">
                Upload a clear, close-up photo of the pest. The AI will tell you what it is,
                how to treat it, and let you log it as an outbreak.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ---- Upload zone ---- */}
        <section className="lg:col-span-2 card-padded">
          <h2 className="font-display text-xl font-bold text-leaf-900 mb-4 flex items-center gap-2">
            <Camera size={20} /> Add a photo
          </h2>

          {!preview ? (
            <div className="space-y-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full p-6 rounded-3xl border-2 border-leaf-200 bg-leaf-50 hover:bg-leaf-100 transition flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-leaf-700 text-leaf-50 flex items-center justify-center group-hover:scale-105 transition">
                  <Camera size={26} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-display text-lg font-bold text-leaf-900">Use Camera</p>
                  <p className="text-xs text-leaf-600">Take a photo of the pest right now</p>
                </div>
                <ArrowRight size={20} className="text-leaf-500" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 rounded-3xl border-2 border-earth-200 bg-earth-50 hover:bg-earth-100 transition flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-earth-500 text-white flex items-center justify-center group-hover:scale-105 transition">
                  <ImageIcon size={26} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-display text-lg font-bold text-earth-900">From Gallery</p>
                  <p className="text-xs text-earth-700">Pick an existing photo from your device</p>
                </div>
                <ArrowRight size={20} className="text-earth-600" />
              </button>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden
                onChange={(e) => handleFile(e.target.files?.[0])} />
              <input ref={fileInputRef} type="file" accept="image/*" hidden
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-leaf-950 relative">
                <img src={preview} alt="Selected" className="w-full h-full object-contain" />
                {analyzing && (
                  <div className="absolute inset-0 bg-leaf-950/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-leaf-50">
                    <div className="absolute inset-x-0 h-px bg-leaf-200/80 animate-scan" />
                    <Loader2 size={40} className="animate-spin mb-3" />
                    <p className="font-display text-lg">Analysing image…</p>
                  </div>
                )}
              </div>
              <button onClick={reset} disabled={analyzing}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow flex items-center justify-center text-leaf-700">
                <X size={18} />
              </button>
              {!result && !warning && (
                <button onClick={analyze} disabled={analyzing}
                  className="btn-primary w-full mt-4 py-3 text-base">
                  {analyzing ? <><Loader2 size={18} className="animate-spin" /> Analysing…</> :
                    <><Sparkles size={18} /> Identify pest</>}
                </button>
              )}
            </div>
          )}

          {/* Tips card */}
          <div className="mt-5 p-4 rounded-2xl bg-earth-50/70 border border-earth-100">
            <p className="text-xs font-semibold text-earth-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info size={14} /> For best results
            </p>
            <ul className="text-xs text-earth-900/85 space-y-1 leading-relaxed">
              <li>• Get close — the pest should fill most of the frame</li>
              <li>• Use daylight when possible, avoid harsh shadows</li>
              <li>• Keep the camera steady and focused</li>
              <li>• A plain leaf or paper background helps the AI</li>
            </ul>
          </div>
        </section>

        {/* ---- Result panel ---- */}
        <section className="lg:col-span-3">
          {warning ? (
            <NoPestWarning warning={warning} onRetry={reset} />
          ) : !result ? (
            <EmptyState />
          ) : (
            <ResultView
              result={result}
              pestInfo={pestInfo}
              onReport={() => navigate('/reports/new', {
                state: {
                  pest_class: result.scan.predicted_class,
                  scan_id: result.scan.id,
                  image_path: result.scan.image_path,
                }
              })}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card-padded h-full min-h-[400px] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-3xl bg-leaf-100 flex items-center justify-center mb-4">
        <Sparkles size={36} className="text-leaf-500" />
      </div>
      <h3 className="font-display text-2xl font-bold text-leaf-900">Awaiting an image</h3>
      <p className="text-leaf-600 mt-2 max-w-sm text-sm">
        Choose a photo on the left and we'll identify the pest in seconds.
      </p>
    </div>
  )
}

function NoPestWarning({ warning, onRetry }) {
  return (
    <div className="card-padded space-y-5 animate-fade-in">
      <div className="rounded-3xl p-6 bg-gradient-to-br from-earth-50 to-ember-50 border-2 border-earth-300">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-earth-500 text-white flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-earth-700">No pest detected</p>
            <h3 className="font-display text-2xl font-bold text-leaf-950 mt-1">
              We couldn't find a pest in this image
            </h3>
            <p className="text-leaf-700 mt-2 leading-relaxed">
              {warning.message}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-leaf-50 border border-leaf-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-leaf-700 mb-2 flex items-center gap-1.5">
          <Info size={14} /> What might have happened?
        </p>
        <ul className="text-sm text-leaf-800 space-y-1.5 leading-relaxed">
          <li>• The photo may not contain an insect or pest at all</li>
          <li>• The pest might be too small, too far, or too blurry to identify</li>
          <li>• The lighting may have been too dim or too harsh</li>
          <li>• The pest may not be in our library (we cover 100+ species)</li>
        </ul>
      </div>

      <button onClick={onRetry} className="btn-primary w-full py-3 text-base">
        <Camera size={18} /> Try another photo
      </button>
    </div>
  )
}

function ResultView({ result, pestInfo, onReport }) {
  const scan = result.scan
  const meets = result.meets_threshold
  const conf = (scan.confidence * 100).toFixed(1)
  const sortedPreds = Object.entries(scan.all_predictions || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
  const [showAll, setShowAll] = useState(false)

  const friendlyName = pestInfo?.friendly_name || scan.predicted_class

  return (
    <div className="space-y-5 animate-fade-in">
      <div className={`rounded-3xl p-6 ${meets
        ? 'bg-gradient-to-br from-leaf-50 to-leaf-100/50 border-2 border-leaf-300'
        : 'bg-gradient-to-br from-earth-50 to-earth-100/50 border-2 border-earth-300'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
            ${meets ? 'bg-leaf-700 text-leaf-50' : 'bg-earth-500 text-white'}`}>
            {meets ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-leaf-600">
              {meets ? 'Identified' : 'Low confidence — verify carefully'}
            </p>
            <h2 className="font-display text-3xl font-bold text-leaf-950 mt-0.5">{friendlyName}</h2>
            {pestInfo?.scientific_name && (
              <p className="text-sm italic text-leaf-700">{pestInfo.scientific_name}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-leaf-200 overflow-hidden">
                <div className="h-full rounded-full bg-leaf-700 transition-all duration-1000"
                  style={{ width: `${conf}%` }} />
              </div>
              <span className="font-mono text-sm font-bold text-leaf-900">{conf}%</span>
            </div>
          </div>
        </div>
      </div>

      {pestInfo?.description && (
        <div className="card-padded">
          <h3 className="font-display text-lg font-bold text-leaf-900 mb-2 flex items-center gap-2">
            <Bug size={18} className="text-leaf-600" />
            About this pest
          </h3>
          <p className="text-sm text-leaf-700 leading-relaxed">{pestInfo.description}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <InfoCard icon={Wheat}  title="Affected crops"   text={pestInfo?.affected_crops}    tone="earth" />
        <InfoCard icon={AlertCircle} title="Symptoms"   text={pestInfo?.symptoms}          tone="ember" />
        <InfoCard icon={Sprout} title="Organic control" text={pestInfo?.organic_control}   tone="leaf" />
        <InfoCard icon={Pill}   title="Chemical control" text={pestInfo?.chemical_control}  tone="leaf" />
        <InfoCard icon={Shield} title="Prevention"      text={pestInfo?.prevention}        tone="earth" full />
      </div>

      <div>
        <button onClick={() => setShowAll(!showAll)}
          className="text-sm text-leaf-700 hover:text-leaf-900 inline-flex items-center gap-1 font-semibold">
          <ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
          {showAll ? 'Hide' : 'Show'} all predictions
        </button>
        {showAll && (
          <div className="mt-3 card-padded space-y-2">
            {sortedPreds.map(([name, p], i) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={i === 0 ? 'font-bold text-leaf-900' : 'text-leaf-700'}>
                    {i + 1}. {name}
                  </span>
                  <span className="font-mono text-leaf-600">{(p * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-leaf-100">
                  <div className="h-full rounded-full bg-leaf-600" style={{ width: `${p * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={onReport} className="btn-primary flex-1 py-3 text-base">
          <FileText size={18} /> Save as outbreak report
        </button>
        <Link to="/learn" className="btn-secondary">
          <BookOpen size={16} /> Learn more
        </Link>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, title, text, tone, full }) {
  const styles = {
    leaf:  'bg-leaf-100 text-leaf-700',
    earth: 'bg-earth-100 text-earth-700',
    ember: 'bg-ember-100 text-ember-700',
  }[tone]
  return (
    <div className={`card p-4 ${full ? 'sm:col-span-2' : ''}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${styles}`}>
          <Icon size={16} />
        </div>
        <h4 className="font-display font-bold text-leaf-900">{title}</h4>
      </div>
      <p className="text-sm text-leaf-700 leading-relaxed whitespace-pre-line">
        {text || <em className="text-leaf-400">No information available</em>}
      </p>
    </div>
  )
}